// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn fetch_gameinfo(url: String) -> Result<String, String> {
    use std::process::Command;
    let output = Command::new("curl.exe")
        .args(["-s", "-L", "--max-time", "8", &url])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(format!("curl error: exit code {:?}", output.status.code()));
    }

    String::from_utf8(output.stdout).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, fetch_gameinfo])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
