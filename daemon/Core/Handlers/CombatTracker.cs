using System.Collections.Concurrent;
using Serilog;

namespace AMT.Core.Handlers;

public class SpellHitRecord
{
    public int SpellIndex { get; set; }
    public string Name { get; set; } = "Auto Attack";
    public string Slot { get; set; } = "Auto Attack";
    public double TotalDamage { get; set; }
    public int Hits { get; set; }
}

public class CombatantRecord
{
    public long ObjectId { get; set; }
    public string Name { get; set; } = "";
    public double TotalDamageDealt { get; set; }
    public double TotalDamageTaken { get; set; }
    public double TotalHealingDealt { get; set; }
    public ConcurrentDictionary<int, SpellHitRecord> Spells { get; } = new();
    public DateTime? FirstCombatAt { get; set; }
    public DateTime? LastCombatAt { get; set; }

    public double ActiveCombatSeconds
    {
        get
        {
            if (!FirstCombatAt.HasValue || !LastCombatAt.HasValue) return 0;
            var diff = (LastCombatAt.Value - FirstCombatAt.Value).TotalSeconds;
            return Math.Max(1.0, diff);
        }
    }

    public int Dps => ActiveCombatSeconds > 0 ? (int)Math.Round(TotalDamageDealt / ActiveCombatSeconds) : 0;
    public int Hps => ActiveCombatSeconds > 0 ? (int)Math.Round(TotalHealingDealt / ActiveCombatSeconds) : 0;
}

public class CombatTracker
{
    private static readonly Lazy<CombatTracker> _lazy = new(() => new CombatTracker());
    public static CombatTracker Instance => _lazy.Value;

    public long LocalPlayerObjectId { get; set; }
    public string? LocalPlayerName { get; set; }

    // Store combatants keyed by unique player name (case-insensitive) to prevent duplicates
    private readonly ConcurrentDictionary<string, CombatantRecord> _combatantsByName = new(StringComparer.OrdinalIgnoreCase);

    // Map current instance ObjectId -> Player Name
    private readonly ConcurrentDictionary<long, string> _objectIdToName = new();

    // Active confirmed party member names
    private readonly HashSet<string> _partyMembers = new(StringComparer.OrdinalIgnoreCase);

    public event Action? OnCombatUpdated;

    private CombatTracker()
    {
    }

    public void SetLocalPlayer(long objectId, string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return;

        LocalPlayerObjectId = objectId;

        // Clean up any old placeholder name (like "Adventurer") if real name is now known
        if (!string.IsNullOrWhiteSpace(LocalPlayerName) && !LocalPlayerName.Equals(name, StringComparison.OrdinalIgnoreCase))
        {
            _combatantsByName.TryRemove(LocalPlayerName, out _);
        }
        _combatantsByName.TryRemove("Adventurer", out _);

        LocalPlayerName = name;

        // Clean any old objectId mapping for this player
        foreach (var kvp in _objectIdToName.ToList())
        {
            if (kvp.Value.Equals(LocalPlayerName, StringComparison.OrdinalIgnoreCase))
            {
                _objectIdToName.TryRemove(kvp.Key, out _);
            }
        }

        _objectIdToName[objectId] = LocalPlayerName;

        // Ensure canonical record exists under LocalPlayerName
        var record = _combatantsByName.GetOrAdd(LocalPlayerName, pName => new CombatantRecord
        {
            ObjectId = objectId,
            Name = pName
        });
        record.ObjectId = objectId;
        record.Name = LocalPlayerName;
    }

    public void RegisterEntity(long objectId, string name)
    {
        if (objectId == 0 || string.IsNullOrWhiteSpace(name)) return;

        _objectIdToName[objectId] = name;

        // If this entity belongs to someone in party, update their ObjectId
        if (_partyMembers.Contains(name))
        {
            var record = _combatantsByName.GetOrAdd(name, pName => new CombatantRecord
            {
                ObjectId = objectId,
                Name = pName
            });
            record.ObjectId = objectId;
        }
    }

    public void OnClusterChanged()
    {
        // Entity ObjectIds are invalid in the new cluster/map
        _objectIdToName.Clear();
        if (LocalPlayerObjectId != 0 && !string.IsNullOrWhiteSpace(LocalPlayerName))
        {
            _objectIdToName[LocalPlayerObjectId] = LocalPlayerName;
        }
        Log.Debug("CombatTracker: Cluster changed, entity ObjectId mappings reset.");
    }

    public void SetPartyMembers(IEnumerable<string> names)
    {
        var activeNames = new HashSet<string>(names.Where(n => !string.IsNullOrWhiteSpace(n)), StringComparer.OrdinalIgnoreCase);

        _partyMembers.Clear();
        foreach (var n in activeNames)
        {
            _partyMembers.Add(n);
        }

        if (!string.IsNullOrWhiteSpace(LocalPlayerName))
        {
            activeNames.Add(LocalPlayerName);
        }

        // Register new party members
        foreach (var name in _partyMembers)
        {
            if (!_combatantsByName.ContainsKey(name))
            {
                var dummyId = (long)Math.Abs(name.GetHashCode());
                _combatantsByName.TryAdd(name, new CombatantRecord
                {
                    ObjectId = dummyId,
                    Name = name
                });
            }
        }

        // Remove members that are no longer in party (except local player)
        foreach (var existingName in _combatantsByName.Keys.ToList())
        {
            if (!activeNames.Contains(existingName) && (LocalPlayerName == null || !existingName.Equals(LocalPlayerName, StringComparison.OrdinalIgnoreCase)))
            {
                _combatantsByName.TryRemove(existingName, out _);
            }
        }

        OnCombatUpdated?.Invoke();
    }

    public void RegisterDamage(long affectedId, long causerId, double healthChange, int spellIndex)
    {
        if (healthChange == 0) return;

        var now = DateTime.UtcNow;

        // Negative healthChange = Damage
        if (healthChange < 0)
        {
            double dmg = Math.Abs(healthChange);

            // Resolve causer player name
            string? causerName = null;
            if (LocalPlayerObjectId != 0 && causerId == LocalPlayerObjectId && !string.IsNullOrWhiteSpace(LocalPlayerName))
            {
                causerName = LocalPlayerName;
            }
            else if (_objectIdToName.TryGetValue(causerId, out var name))
            {
                // Only track if causer is confirmed local player or party member
                if (!string.IsNullOrWhiteSpace(LocalPlayerName) && name.Equals(LocalPlayerName, StringComparison.OrdinalIgnoreCase))
                {
                    causerName = LocalPlayerName;
                }
                else if (_partyMembers.Contains(name))
                {
                    causerName = name;
                }
            }

            // CRITICAL FIX: Ignore damage from mobs or outside players. Never attribute to "Adventurer"!
            if (string.IsNullOrWhiteSpace(causerName) || causerName.Equals("Adventurer", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var combatant = _combatantsByName.GetOrAdd(causerName, pName => new CombatantRecord
            {
                ObjectId = causerId,
                Name = pName
            });

            combatant.FirstCombatAt ??= now;
            combatant.LastCombatAt = now;
            combatant.TotalDamageDealt += dmg;

            // Track spell breakdown
            var spell = combatant.Spells.GetOrAdd(spellIndex, idx => new SpellHitRecord
            {
                SpellIndex = idx,
                Name = ResolveSpellName(idx),
                Slot = ResolveSpellSlot(idx)
            });
            spell.Hits++;
            spell.TotalDamage += dmg;

            OnCombatUpdated?.Invoke();

            // Damage taken by local player
            if (LocalPlayerObjectId != 0 && affectedId == LocalPlayerObjectId && !string.IsNullOrWhiteSpace(LocalPlayerName))
            {
                if (_combatantsByName.TryGetValue(LocalPlayerName, out var local))
                {
                    local.TotalDamageTaken += dmg;
                    OnCombatUpdated?.Invoke();
                }
            }
        }
        else // Positive healthChange = Healing
        {
            double heal = healthChange;
            string? causerName = null;
            if (LocalPlayerObjectId != 0 && causerId == LocalPlayerObjectId && !string.IsNullOrWhiteSpace(LocalPlayerName))
            {
                causerName = LocalPlayerName;
            }
            else if (_objectIdToName.TryGetValue(causerId, out var name))
            {
                if (!string.IsNullOrWhiteSpace(LocalPlayerName) && name.Equals(LocalPlayerName, StringComparison.OrdinalIgnoreCase))
                {
                    causerName = LocalPlayerName;
                }
                else if (_partyMembers.Contains(name))
                {
                    causerName = name;
                }
            }

            if (!string.IsNullOrWhiteSpace(causerName) && !causerName.Equals("Adventurer", StringComparison.OrdinalIgnoreCase))
            {
                if (_combatantsByName.TryGetValue(causerName, out var healer))
                {
                    healer.FirstCombatAt ??= now;
                    healer.LastCombatAt = now;
                    healer.TotalHealingDealt += heal;
                    OnCombatUpdated?.Invoke();
                }
            }
        }
    }

    public void Reset()
    {
        _combatantsByName.Clear();
        _objectIdToName.Clear();

        if (!string.IsNullOrWhiteSpace(LocalPlayerName))
        {
            _combatantsByName[LocalPlayerName] = new CombatantRecord
            {
                ObjectId = LocalPlayerObjectId,
                Name = LocalPlayerName
            };
            if (LocalPlayerObjectId != 0)
            {
                _objectIdToName[LocalPlayerObjectId] = LocalPlayerName;
            }
        }

        foreach (var member in _partyMembers)
        {
            _combatantsByName[member] = new CombatantRecord
            {
                ObjectId = (long)Math.Abs(member.GetHashCode()),
                Name = member
            };
        }

        OnCombatUpdated?.Invoke();
        Log.Information("CombatTracker: State reset to zero.");
    }

    public object[] BuildPartyMembersPayload()
    {
        // Never include placeholder "Adventurer" if real name is known
        _combatantsByName.TryRemove("Adventurer", out _);

        // Ensure local player record is present if known
        if (!string.IsNullOrWhiteSpace(LocalPlayerName) && !_combatantsByName.ContainsKey(LocalPlayerName))
        {
            _combatantsByName[LocalPlayerName] = new CombatantRecord
            {
                ObjectId = LocalPlayerObjectId != 0 ? LocalPlayerObjectId : 1,
                Name = LocalPlayerName
            };
        }

        var list = _combatantsByName.Values
            .Where(c => !string.IsNullOrWhiteSpace(c.Name) && !c.Name.Equals("Adventurer", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (list.Count == 0)
        {
            string fallbackName = !string.IsNullOrWhiteSpace(LocalPlayerName) ? LocalPlayerName : "Waiting for Character...";
            return new[]
            {
                new
                {
                    id = (LocalPlayerObjectId != 0 ? LocalPlayerObjectId : 1).ToString(),
                    name = fallbackName,
                    guild = (string?)null,
                    currentHp = 3000,
                    maxHp = 3000,
                    dps = 0,
                    damagePercentage = 100.0,
                    hps = 0,
                    role = "DPS",
                    spells = Array.Empty<object>()
                }
            };
        }

        double totalPartyDamage = list.Sum(c => c.TotalDamageDealt);
        if (totalPartyDamage <= 0) totalPartyDamage = 1.0;

        return list.Select(c => new
        {
            id = c.ObjectId.ToString(),
            name = c.Name,
            guild = (string?)null,
            currentHp = 3000,
            maxHp = 3000,
            dps = c.Dps,
            damagePercentage = Math.Round((c.TotalDamageDealt / totalPartyDamage) * 100.0, 1),
            hps = c.Hps,
            role = c.Hps > c.Dps ? "Healer" : "DPS",
            spells = c.Spells.Values.Select(s => new
            {
                id = s.SpellIndex.ToString(),
                name = s.Name,
                slot = s.Slot,
                damage = (int)Math.Round(s.TotalDamage),
                hits = s.Hits,
                critRate = 0
            }).ToArray()
        }).ToArray();
    }

    private static string ResolveSpellName(int spellIndex)
    {
        if (spellIndex <= 0) return "Auto Attack";
        return $"Ability #{spellIndex}";
    }

    private static string ResolveSpellSlot(int spellIndex)
    {
        if (spellIndex <= 0) return "Auto Attack";
        if (spellIndex <= 4) return "Q";
        if (spellIndex <= 8) return "W";
        if (spellIndex <= 12) return "E";
        return "Passive";
    }
}
