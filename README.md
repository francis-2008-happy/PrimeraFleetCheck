# Overview

Primera Fleet Check is a mobile app that lets a driver record a quick daily vehicle inspection. The idea comes from my work at Primera, where keeping simple records for each vehicle helps track fuel use and spot problems early. My goal was to take an app that only saved data on one phone and connect it to a cloud database, so the records are backed up and can be seen from any device.

How to use it: the first screen lists every check-in stored in the cloud, with a search bar and a filter that shows only vehicles that need attention. Tap **+ New Check-In** to choose a vehicle, enter the odometer and fuel level, mark each item on an inspection checklist (tyres, lights, brakes, fluids, wipers, mirrors, horn) as OK or Defect, and add notes. Saving inserts the check-in into the cloud database. Tap any check-in to see its details, where you can edit it, delete it, or mark its defects as resolved. The list updates by itself in real time whenever the data changes, even if the change was made on another phone or directly in the database.

Software Demo Video: https://www.loom.com/share/0c79167b11e54e058e7e8d0cf7c45ba8 

# Cloud Database

The app uses **Supabase**, a hosted cloud database built on PostgreSQL. The app talks to it through the Supabase JavaScript client, which handles inserting, modifying, deleting and retrieving data, and uses **Supabase Realtime** to receive a notification whenever the data changes so the screens update automatically.

The database has one table, `checkins`, with one row per vehicle inspection:

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key, created by the database |
| vehicle | text | Which vehicle was checked |
| odometer | integer | Kilometres, 0 to 9,999,999 |
| fuel_level | text | One of Full, 3/4, 1/2, 1/4, Low |
| defects | text[] | Checklist items that failed |
| resolved | boolean | True once the defects are fixed |
| notes | text | Driver's notes |
| date | date | Day of the inspection |
| created_at / updated_at | timestamptz | When the row was added / last changed |

Security is handled with Row Level Security policies that only allow signed-in users to read or write, and the app signs each phone in anonymously. CHECK constraints on the table reject invalid data. The full setup is in `supabase-setup.sql`. The project URL and key are kept in a `.env.local` file that is not committed (see `.env.example`).

# Development Environment

I built the app with React Native and the Expo toolchain, and tested it on my iPhone through the Expo Go app. I wrote the code in Visual Studio Code and used Git and GitHub for version control.

The app is written in TypeScript. It uses the Supabase JavaScript client (`@supabase/supabase-js`) for the cloud database and live updates, React Navigation to move between screens, AsyncStorage to keep the user signed in, Expo Haptics for vibration feedback, and Expo Vector Icons for icons.

# Useful Websites

* [Supabase Documentation](https://supabase.com/docs)
* [Supabase with Expo React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
* [Supabase Realtime: Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
* [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
* [Expo Documentation](https://docs.expo.dev/)
* [React Navigation Documentation](https://reactnavigation.org/)

# Future Work

* Add real user accounts with email login, so each check-in records which driver did it.
* Let the driver attach a photo of any issue using Supabase Storage.
* Add a vehicles table linked to check-ins, and a history screen for each vehicle.
* Work offline and sync the check-ins when the phone reconnects.
