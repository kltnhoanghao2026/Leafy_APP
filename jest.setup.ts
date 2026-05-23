jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => undefined;
  return Reanimated;
});

jest.mock("react-native-worklets-core", () => ({}));
jest.mock("react-native-worklets", () => ({}));

jest.mock("lucide-react-native", () => {
  return new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        () =>
          null,
    },
  );
});
