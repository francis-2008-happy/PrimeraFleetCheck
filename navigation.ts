// The list of screens in the app and what data each one needs when opened.
// "undefined" means the screen needs no data passed to it.
// We pass an id (not the whole check-in) so each screen always loads the
// latest saved version, even right after it has been edited.
export type RootStackParamList = {
  List: undefined;
  CheckInForm: { checkInId?: string }; // no id = new check-in, id = edit that one
  Details: { checkInId: string };
};
