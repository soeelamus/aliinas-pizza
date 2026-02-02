package com.aliinas.foodtruck;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

  private static final int REQ_BT_PERMS = 1002;
  private static final int REQ_LOC_PERMS = 1001;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    requestBluetoothPermissionsIfNeeded();
  }

  private void requestBluetoothPermissionsIfNeeded() {
    // Android 11 of lager
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      ArrayList<String> needed = new ArrayList<>();

      if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
          != PackageManager.PERMISSION_GRANTED) {
        needed.add(Manifest.permission.ACCESS_FINE_LOCATION);
      }

      if (!needed.isEmpty()) {
        ActivityCompat.requestPermissions(this, needed.toArray(new String[0]), REQ_LOC_PERMS);
      }
      return;
    }

    // Android 12+ (incl. Android 13)
    ArrayList<String> needed = new ArrayList<>();

    if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN)
        != PackageManager.PERMISSION_GRANTED) {
      needed.add(Manifest.permission.BLUETOOTH_SCAN);
    }

    if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT)
        != PackageManager.PERMISSION_GRANTED) {
      needed.add(Manifest.permission.BLUETOOTH_CONNECT);
    }

    // Optioneel maar vaak handig als fallback
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
        != PackageManager.PERMISSION_GRANTED) {
      needed.add(Manifest.permission.ACCESS_FINE_LOCATION);
    }

    if (!needed.isEmpty()) {
      ActivityCompat.requestPermissions(this, needed.toArray(new String[0]), REQ_BT_PERMS);
    }
  }
}
