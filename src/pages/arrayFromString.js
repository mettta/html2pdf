export default function arrayFromString(string) {
  // * The settings may pass an empty string, prevent errors here.
  return string?.length ? string?.split(/\s+/).filter(Boolean) : [];
}
