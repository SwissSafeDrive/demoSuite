use std::{
    fs::File,
    io::{self, Read},
    net::{TcpListener, TcpStream},
    os::unix::process::CommandExt,
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::Duration,
};

use serde::Serialize;
use tauri::Manager;

struct BackendState {
    child: Mutex<Option<Child>>,
    session_token: String,
    port: u16,
    data_dir: PathBuf,
}

#[derive(Serialize)]
struct BackendConfig {
    api_url: String,
    session_token: String,
}

fn generate_random_token() -> io::Result<String> {
    let mut file = File::open("/dev/urandom")?;
    let mut bytes = [0u8; 32];
    file.read_exact(&mut bytes)?;
    let mut hex = String::with_capacity(64);
    for b in bytes {
        hex.push_str(&format!("{:02x}", b));
    }
    Ok(hex)
}

fn select_controlled_port() -> io::Result<u16> {
    for port in 8765..=8770 {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            continue;
        }
        if let Ok(listener) = TcpListener::bind(("127.0.0.1", port)) {
            drop(listener);
            return Ok(port);
        }
    }
    Err(io::Error::new(
        io::ErrorKind::AddrInUse,
        "Porte locali controllate (8765-8770) occupate da altri processi",
    ))
}

fn terminate_own_child(child_opt: &mut Option<Child>, data_dir: &PathBuf) {
    if let Some(child) = child_opt.as_mut() {
        let pid = child.id();
        if pid > 1 {
            let neg_pgid = format!("-{}", pid);
            let pid_str = pid.to_string();
            let _ = Command::new("/bin/kill")
                .args(["-TERM", &neg_pgid])
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();
            let _ = Command::new("/bin/kill")
                .args(["-TERM", &pid_str])
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status();
        }
        for _ in 0..20 {
            if let Ok(Some(_)) = child.try_wait() {
                break;
            }
            thread::sleep(Duration::from_millis(50));
        }
        let _ = child.kill();
        let _ = child.wait();
    }
    *child_opt = None;

    let capturas_dir = data_dir.join("capturas");
    if capturas_dir.is_dir() {
        let _ = std::fs::remove_dir_all(&capturas_dir);
    }
}

#[tauri::command]
fn get_session_token(state: tauri::State<'_, BackendState>) -> String {
    state.session_token.clone()
}

#[tauri::command]
fn get_backend_config(state: tauri::State<'_, BackendState>) -> BackendConfig {
    BackendConfig {
        api_url: format!("http://127.0.0.1:{}", state.port),
        session_token: state.session_token.clone(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let resource_dir = app.path().resource_dir()?;

            let candidate_a =
                resource_dir.join("resources/swisssafedrive-backend-aarch64");
            let candidate_b =
                resource_dir.join("swisssafedrive-backend-aarch64");

            let backend_path = if candidate_a.exists() {
                candidate_a
            } else if candidate_b.exists() {
                candidate_b
            } else {
                return Err(io::Error::new(
                    io::ErrorKind::NotFound,
                    "Backend locale SwissSafeDrive non trovato nel pacchetto applicativo",
                )
                .into());
            };

            let port = select_controlled_port()?;
            let session_token = generate_random_token()?;

            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;

            let parent_pid = std::process::id().to_string();

            let mut cmd = Command::new(&backend_path);
            cmd.env("SSD_DATA_DIR", &data_dir)
                .env("SSD_PORT", port.to_string())
                .env("SSD_SESSION_TOKEN", &session_token)
                .env("SSD_PARENT_PID", &parent_pid)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .process_group(0);

            let child = cmd.spawn().map_err(|e| {
                io::Error::new(
                    io::ErrorKind::Other,
                    format!("Impossibile avviare il backend locale: {}", e),
                )
            })?;

            app.manage(BackendState {
                child: Mutex::new(Some(child)),
                session_token,
                port,
                data_dir,
            });

            let mut ready = false;
            for _ in 0..250 {
                if TcpStream::connect(("127.0.0.1", port)).is_ok() {
                    ready = true;
                    break;
                }
                thread::sleep(Duration::from_millis(100));
            }

            if !ready {
                if let Some(state) = app.try_state::<BackendState>() {
                    if let Ok(mut guard) = state.child.lock() {
                        terminate_own_child(&mut guard, &state.data_dir);
                    }
                }
                return Err(io::Error::new(
                    io::ErrorKind::TimedOut,
                    "Il backend SwissSafeDrive non ha risposto entro 25 secondi",
                )
                .into());
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_session_token,
            get_backend_config
        ])
        .build(tauri::generate_context!())
        .expect("error while building SwissSafeDrive");

    app.run(|app_handle, event| {
        if matches!(
            event,
            tauri::RunEvent::Exit | tauri::RunEvent::ExitRequested { .. }
        ) {
            if let Some(state) = app_handle.try_state::<BackendState>() {
                if let Ok(mut guard) = state.child.lock() {
                    terminate_own_child(&mut guard, &state.data_dir);
                }
            }
        }
    });
}
