import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDJ53fIr5_aWs7LZHMldOgjOTlp86DaZbo',
    appId: '1:58934905684:web:1145d940e396a2ffe816c1',
    messagingSenderId: '58934905684',
    projectId: 'expense-tracker-dev94',
    authDomain: 'expense-tracker-dev94.firebaseapp.com',
    storageBucket: 'expense-tracker-dev94.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDJ53fIr5_aWs7LZHMldOgjOTlp86DaZbo',
    appId: '1:58934905684:android:1234567890abcdef', // Mocking android app id, might need adjustment for production
    messagingSenderId: '58934905684',
    projectId: 'expense-tracker-dev94',
    storageBucket: 'expense-tracker-dev94.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDJ53fIr5_aWs7LZHMldOgjOTlp86DaZbo',
    appId: '1:58934905684:ios:1234567890abcdef',
    messagingSenderId: '58934905684',
    projectId: 'expense-tracker-dev94',
    storageBucket: 'expense-tracker-dev94.firebasestorage.app',
    iosBundleId: 'com.example.expenseTracker',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyDJ53fIr5_aWs7LZHMldOgjOTlp86DaZbo',
    appId: '1:58934905684:ios:1234567890abcdef',
    messagingSenderId: '58934905684',
    projectId: 'expense-tracker-dev94',
    storageBucket: 'expense-tracker-dev94.firebasestorage.app',
    iosBundleId: 'com.example.expenseTracker',
  );
}
