package co.hivezone.app;

import android.os.Bundle;
import android.graphics.Color;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Match brand color yellow (#ffc107) for smooth transitions
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setBackgroundColor(Color.parseColor("#ffc107"));
        }

        // 1. Force total Edge-to-Edge immersion: Extend app content into system bar areas
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}

