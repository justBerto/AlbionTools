// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::process::Child;
use std::sync::Mutex;
use tauri::Manager;

struct DaemonManager(Mutex<Option<Child>>);

impl Drop for DaemonManager {
    fn drop(&mut self) {
        if let Ok(mut lock) = self.0.lock() {
            if let Some(mut child) = lock.take() {
                let _ = child.kill();
            }
        }
    }
}

fn spawn_daemon() -> Option<Child> {
    use std::process::Command;
    #[cfg(windows)]
    use std::os::windows::process::CommandExt;

    let mut candidates = Vec::new();

    // 1. Next to the running executable (Production bundled by Tauri)
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            candidates.push(parent.join("AlbionTools.Daemon.exe"));
            candidates.push(parent.join("binaries/AlbionTools.Daemon.exe"));
            candidates.push(parent.join("binaries/AlbionTools.Daemon-x86_64-pc-windows-msvc.exe"));
        }
    }

    // 2. Relative paths (Development mode)
    candidates.push(std::path::PathBuf::from("src-tauri/binaries/AlbionTools.Daemon-x86_64-pc-windows-msvc.exe"));
    candidates.push(std::path::PathBuf::from("src-tauri/binaries/AlbionTools.Daemon.exe"));
    candidates.push(std::path::PathBuf::from("daemon/publish/AlbionTools.Daemon.exe"));
    candidates.push(std::path::PathBuf::from("daemon/bin/Debug/net9.0/AlbionTools.Daemon.exe"));
    candidates.push(std::path::PathBuf::from("../daemon/publish/AlbionTools.Daemon.exe"));
    candidates.push(std::path::PathBuf::from("../daemon/bin/Debug/net9.0/AlbionTools.Daemon.exe"));

    for candidate in candidates {
        if candidate.exists() {
            let mut cmd = Command::new(&candidate);
            #[cfg(windows)]
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW: runs completely silent in background

            if let Ok(child) = cmd.spawn() {
                println!("🟢 [AlbionTools] Sniffer Daemon successfully launched from {:?}", candidate);
                return Some(child);
            }
        }
    }

    println!("⚠️ [AlbionTools] Could not find or launch AlbionTools.Daemon executable");
    None
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn fetch_gameinfo(url: String) -> Result<String, String> {
    use std::process::Command;
    #[cfg(windows)]
    use std::os::windows::process::CommandExt;

    let mut cmd = Command::new("curl.exe");
    cmd.args(["-s", "-L", "--max-time", "8", &url]);

    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW: prevents CMD popup window

    let output = cmd.output().map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(format!("curl error: exit code {:?}", output.status.code()));
    }

    String::from_utf8(output.stdout).map_err(|e| e.to_string())
}

#[tauri::command]
fn show_overlay_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("overlay") {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;
        win.set_always_on_top(true).map_err(|e| e.to_string())?;
    } else {
        let win = tauri::WebviewWindowBuilder::new(
            &app,
            "overlay",
            tauri::WebviewUrl::App("index.html?overlay=true".into()),
        )
        .title("AlbionTools DPS Meter")
        .inner_size(360.0, 340.0)
        .min_inner_size(260.0, 180.0)
        .always_on_top(true)
        .decorations(false)
        .transparent(false)
        .resizable(true)
        .build()
        .map_err(|e| e.to_string())?;

        let _ = win.show();
        let _ = win.set_focus();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, fetch_gameinfo, show_overlay_window])
        .setup(|app| {
            let daemon_child = spawn_daemon();
            app.manage(DaemonManager(Mutex::new(daemon_child)));

            if let Some(main_win) = app.get_webview_window("main") {
                let _ = main_win.set_theme(Some(tauri::Theme::Dark));
                #[cfg(debug_assertions)]
                main_win.open_devtools();
            }
            if let Some(overlay_win) = app.get_webview_window("overlay") {
                let _ = overlay_win.set_theme(Some(tauri::Theme::Dark));
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    if let Some(state) = window.try_state::<DaemonManager>() {
                        if let Ok(mut lock) = state.0.lock() {
                            if let Some(mut child) = lock.take() {
                                let _ = child.kill();
                            }
                        }
                    }
                    window.app_handle().exit(0);
                } else if window.label() == "overlay" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
