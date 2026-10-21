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
    public string Name { get; set; } = "Adventurer";
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
    public string LocalPlayerName { get; set; } = "Adventurer";

    private readonly ConcurrentDictionary<long, CombatantRecord> _combatants = new();
    private readonly ConcurrentDictionary<long, string> _partyNames = new();

    public event Action? OnCombatUpdated;

    private CombatTracker()
    {
    }

    public void SetLocalPlayer(long objectId, string name)
    {
        LocalPlayerObjectId = objectId;
        if (!string.IsNullOrWhiteSpace(name))
        {
            LocalPlayerName = name;
        }

        var record = _combatants.GetOrAdd(objectId, id => new CombatantRecord
        {
            ObjectId = id,
            Name = LocalPlayerName
        });
        record.Name = LocalPlayerName;
    }

    public void SetPartyMembers(IEnumerable<string> names)
    {
        // Keep local player + party names
        foreach (var name in names)
        {
            if (!string.IsNullOrWhiteSpace(name) && name != LocalPlayerName)
            {
                // Register party member if not exists
                var match = _combatants.Values.FirstOrDefault(c => c.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                if (match == null)
                {
                    var dummyId = (long)name.GetHashCode();
                    _combatants.TryAdd(dummyId, new CombatantRecord
                    {
                        ObjectId = dummyId,
                        Name = name
                    });
                }
            }
        }
    }

    public void RegisterDamage(long affectedId, long causerId, double healthChange, int spellIndex)
    {
        if (healthChange == 0) return;

        var now = DateTime.UtcNow;

        // Negative healthChange = Damage
        if (healthChange < 0)
        {
            double dmg = Math.Abs(healthChange);

            // Is the causer the local player or someone in party?
            bool isLocal = (LocalPlayerObjectId != 0 && causerId == LocalPlayerObjectId);
            bool isKnownCombatant = _combatants.ContainsKey(causerId);

            if (isLocal || isKnownCombatant || (LocalPlayerObjectId == 0 && causerId != 0))
            {
                var combatant = _combatants.GetOrAdd(causerId, id => new CombatantRecord
                {
                    ObjectId = id,
                    Name = isLocal ? LocalPlayerName : $"Player-{id}"
                });

                combatant.FirstCombatAt ??= now;
                combatant.LastCombatAt = now;
                combatant.TotalDamageDealt += dmg;

                // Track spell
                var spell = combatant.Spells.GetOrAdd(spellIndex, idx => new SpellHitRecord
                {
                    SpellIndex = idx,
                    Name = ResolveSpellName(idx),
                    Slot = ResolveSpellSlot(idx)
                });
                spell.Hits++;
                spell.TotalDamage += dmg;

                OnCombatUpdated?.Invoke();
            }

            // Damage taken by local player
            if (LocalPlayerObjectId != 0 && affectedId == LocalPlayerObjectId)
            {
                var local = _combatants.GetOrAdd(LocalPlayerObjectId, id => new CombatantRecord
                {
                    ObjectId = id,
                    Name = LocalPlayerName
                });
                local.TotalDamageTaken += dmg;
                OnCombatUpdated?.Invoke();
            }
        }
        else // Positive healthChange = Healing
        {
            double heal = healthChange;
            if (LocalPlayerObjectId != 0 && causerId == LocalPlayerObjectId)
            {
                var local = _combatants.GetOrAdd(LocalPlayerObjectId, id => new CombatantRecord
                {
                    ObjectId = id,
                    Name = LocalPlayerName
                });
                local.FirstCombatAt ??= now;
                local.LastCombatAt = now;
                local.TotalHealingDealt += heal;
                OnCombatUpdated?.Invoke();
            }
        }
    }

    public void Reset()
    {
        _combatants.Clear();
        if (LocalPlayerObjectId != 0)
        {
            _combatants.TryAdd(LocalPlayerObjectId, new CombatantRecord
            {
                ObjectId = LocalPlayerObjectId,
                Name = LocalPlayerName
            });
        }
        OnCombatUpdated?.Invoke();
        Log.Information("CombatTracker state reset to zero.");
    }

    public object[] BuildPartyMembersPayload()
    {
        // Ensure local player record is always present
        if (LocalPlayerObjectId != 0 && !_combatants.ContainsKey(LocalPlayerObjectId))
        {
            _combatants.TryAdd(LocalPlayerObjectId, new CombatantRecord
            {
                ObjectId = LocalPlayerObjectId,
                Name = LocalPlayerName
            });
        }

        var list = _combatants.Values.ToList();
        if (list.Count == 0)
        {
            // Default solo fallback
            list.Add(new CombatantRecord
            {
                ObjectId = 1,
                Name = !string.IsNullOrWhiteSpace(LocalPlayerName) ? LocalPlayerName : "Adventurer"
            });
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
