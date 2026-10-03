# Overview

Primera Fleet Check is a small mobile app that lets a driver record a quick daily vehicle check. The idea comes from my work at Primera, where keeping simple records for each vehicle helps track fuel use and spot problems early. On the first screen the driver sees a list of the check-ins that have already been saved, with a search bar and a filter that shows only the check-ins that need attention. From there they can open a form to add a new check-in, where they choose a vehicle, enter the odometer reading and the current fuel level, mark each item on an inspection checklist (tyres, lights, brakes, fluids, wipers, mirrors, horn) as OK or Defect, and add notes. The app checks the input, for example warning the driver if the odometer reading is lower than the last one recorded for that vehicle. When they save, the entry is stored on the phone so it stays there even after the app is closed or the phone is restarted. Tapping any entry in the list opens a details screen that shows the full record, where the driver can edit it, delete it, or mark its defects as resolved. The app also supports dark mode and gives haptic feedback when saving.

I built this app to learn how to make a mobile app for the first time. I already knew React for the web, so my goal was to learn the parts that are specific to mobile, such as React Native components, moving between screens with navigation, and saving data on the device with AsyncStorage.

Software Demo Video: https://www.loom.com/share/ad23ec5dd8cb4db994a6d9eaf322dd3e

# Development Environment

I built the app with the Expo toolchain, which made it easy to run and test on my iPhone through the Expo Go app, without needing a Mac or Xcode. Because it is built with React Native, the same code also runs on Android. I wrote the code in Visual Studio Code and used Git and GitHub for version control and publishing.

The app is written in TypeScript with React Native. It uses React Navigation to move between screens, AsyncStorage to save data on the device, Expo Haptics for vibration feedback, and Expo Vector Icons for icons.

# Useful Websites

* [React Native Documentation](https://reactnative.dev/)
* [Expo Documentation](https://docs.expo.dev/)
* [React Navigation Documentation](https://reactnavigation.org/)
* [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)

# Future Work

* Sync the saved check-ins to a cloud database so records are backed up and shared across devices.
* Let the driver attach a photo of any issue using the phone camera.
* Share a check-in as a PDF report so a fleet manager has an audit-ready record.
* Add a history screen for each vehicle showing its odometer and fuel trends.
