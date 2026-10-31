// Runs when another app opens yours (including via the Android Share menu).
// Send share intents to the Home screen, which reads the shared image.
export async function redirectSystemPath({ path }) {
  try {
    if (new URL(path).hostname === "expo-sharing") {
      return "/";
    }
    return path;
  } catch {
    return "/";
  }
}
