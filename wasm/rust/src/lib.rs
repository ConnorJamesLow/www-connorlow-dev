use wasm_bindgen::prelude::*;

/// Returns a greeting string from WASM.
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello from Rust WASM, {}!", name)
}

/// A simple add function exposed to JS.
#[wasm_bindgen]
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}
