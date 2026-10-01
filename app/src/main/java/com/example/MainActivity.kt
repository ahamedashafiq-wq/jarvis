package com.example

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.auth.AuthState
import com.example.ui.AuthScreenState
import com.example.ui.JarvisViewModel
import com.example.ui.SubScreen
import com.example.ui.components.AIOrb
import com.example.ui.components.AIOrbState
import com.example.ui.components.HudBottomNav
import com.example.ui.components.HudTopBar
import com.example.ui.components.JarvisScreen
import com.example.ui.components.MoreMenuSheet
import com.example.ui.screens.AnalyticsScreen
import com.example.ui.screens.BootScreen
import com.example.ui.screens.ChatScreen
import com.example.ui.screens.CommandsScreen
import com.example.ui.screens.DashboardScreen
import com.example.ui.screens.FocusScreen
import com.example.ui.screens.ForgotPasswordScreen
import com.example.ui.screens.LoginScreen
import com.example.ui.screens.LogsScreen
import com.example.ui.screens.MemoryScreen
import com.example.ui.screens.ProfileScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.screens.SignupScreen
import com.example.ui.screens.TasksScreen
import com.example.ui.screens.VoiceScreen
import com.example.ui.theme.JarvisBackground
import com.example.ui.theme.JarvisBright
import com.example.ui.theme.JarvisPrimary
import com.example.ui.theme.JarvisTextMuted
import com.example.ui.theme.JarvisTextPrimary
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                JarvisApp()
            }
        }
    }
}

@Composable
fun JarvisApp(viewModel: JarvisViewModel = viewModel()) {
    val authState by viewModel.authManager.authState.collectAsState()
    val currentSession by viewModel.currentSession.collectAsState()
    val authScreenState by viewModel.authScreenState.collectAsState()
    val isBootComplete by viewModel.isBootComplete.collectAsState()
    val currentScreen by viewModel.currentScreen.collectAsState()
    val currentSubScreen by viewModel.currentSubScreen.collectAsState()
    val isLiveAi = viewModel.geminiService.isLiveAiAvailable

    var showMoreSheet by remember { mutableStateOf(false) }

    // Request audio permission for voice input
    val audioPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            viewModel.trackEvent("AUDIO_PERMISSION_GRANTED", "{}")
        }
    }

    LaunchedEffect(Unit) {
        val audioPermission = Manifest.permission.RECORD_AUDIO
        if (ContextCompat.checkSelfPermission(viewModel.getApplication(), audioPermission) != PackageManager.PERMISSION_GRANTED) {
            audioPermissionLauncher.launch(audioPermission)
        }
    }

    // 1. Loading Authentication State (Session Restoration)
    if (authState == AuthState.AUTHENTICATING && currentSession == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(JarvisBackground)
                .testTag("auth_loading_screen"),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                AIOrb(state = AIOrbState.THINKING, size = 120.dp)
                Spacer(modifier = Modifier.height(20.dp))
                CircularProgressIndicator(color = JarvisBright, strokeWidth = 2.dp)
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "AUTHENTICATING...",
                    color = JarvisBright,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "SYNCING WITH CORE...",
                    color = JarvisTextMuted,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
        return
    }

    // 2. Unauthenticated State -> Route to Login, Signup, or Forgot Password
    if (currentSession == null) {
        BackHandler(enabled = authScreenState != AuthScreenState.LOGIN) {
            viewModel.authScreenState.value = AuthScreenState.LOGIN
        }

        when (authScreenState) {
            AuthScreenState.LOGIN -> LoginScreen(
                authManager = viewModel.authManager,
                onNavigateToSignup = { viewModel.authScreenState.value = AuthScreenState.SIGNUP },
                onNavigateToForgotPassword = { viewModel.authScreenState.value = AuthScreenState.FORGOT_PASSWORD }
            )
            AuthScreenState.SIGNUP -> SignupScreen(
                authManager = viewModel.authManager,
                onNavigateToLogin = { viewModel.authScreenState.value = AuthScreenState.LOGIN }
            )
            AuthScreenState.FORGOT_PASSWORD -> ForgotPasswordScreen(
                authManager = viewModel.authManager,
                onNavigateToLogin = { viewModel.authScreenState.value = AuthScreenState.LOGIN }
            )
        }
        return
    }

    // 3. Authenticated State -> Check Boot sequence
    if (!isBootComplete) {
        BootScreen(
            onComplete = { viewModel.completeBoot() }
        )
        return
    }

    // 4. Main Authenticated Application with Protected Routes & BackHandler
    BackHandler(enabled = isBootComplete && (currentSubScreen != SubScreen.NONE || currentScreen != JarvisScreen.DASHBOARD)) {
        if (currentSubScreen != SubScreen.NONE) {
            viewModel.currentSubScreen.value = SubScreen.NONE
        } else if (currentScreen != JarvisScreen.DASHBOARD) {
            viewModel.currentScreen.value = JarvisScreen.DASHBOARD
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(JarvisBackground),
        contentWindowInsets = WindowInsets.safeDrawing,
        topBar = {
            HudTopBar(
                isLiveAi = isLiveAi,
                onSettingsClick = { viewModel.currentSubScreen.value = SubScreen.SETTINGS },
                onLogsClick = { viewModel.currentSubScreen.value = SubScreen.LOGS }
            )
        },
        bottomBar = {
            HudBottomNav(
                currentScreen = currentScreen,
                onScreenSelected = { screen ->
                    if (screen == JarvisScreen.MORE) {
                        showMoreSheet = true
                    } else {
                        viewModel.currentSubScreen.value = SubScreen.NONE
                        viewModel.currentScreen.value = screen
                    }
                }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(JarvisBackground)
        ) {
            // Protected Sub-screens
            if (currentSubScreen != SubScreen.NONE) {
                when (currentSubScreen) {
                    SubScreen.MEMORY -> MemoryScreen(
                        viewModel = viewModel,
                        onBack = { viewModel.currentSubScreen.value = SubScreen.NONE }
                    )
                    SubScreen.FOCUS -> FocusScreen(
                        viewModel = viewModel,
                        onBack = { viewModel.currentSubScreen.value = SubScreen.NONE }
                    )
                    SubScreen.ANALYTICS -> AnalyticsScreen(
                        viewModel = viewModel,
                        onBack = { viewModel.currentSubScreen.value = SubScreen.NONE }
                    )
                    SubScreen.SETTINGS -> SettingsScreen(
                        viewModel = viewModel,
                        onBack = { viewModel.currentSubScreen.value = SubScreen.NONE }
                    )
                    SubScreen.LOGS -> LogsScreen(
                        viewModel = viewModel,
                        onBack = { viewModel.currentSubScreen.value = SubScreen.NONE }
                    )
                    SubScreen.PROFILE -> ProfileScreen(
                        viewModel = viewModel,
                        onBack = { viewModel.currentSubScreen.value = SubScreen.NONE }
                    )
                    else -> {}
                }
            } else {
                // Primary Protected Screens
                when (currentScreen) {
                    JarvisScreen.DASHBOARD -> DashboardScreen(viewModel = viewModel)
                    JarvisScreen.CHAT -> ChatScreen(viewModel = viewModel)
                    JarvisScreen.VOICE -> VoiceScreen(viewModel = viewModel)
                    JarvisScreen.TASKS -> TasksScreen(viewModel = viewModel)
                    JarvisScreen.COMMANDS -> CommandsScreen(viewModel = viewModel)
                    JarvisScreen.MORE -> DashboardScreen(viewModel = viewModel)
                }
            }
        }
    }

    if (showMoreSheet) {
        MoreMenuSheet(
            onDismiss = { showMoreSheet = false },
            onNavigate = { sub ->
                viewModel.currentSubScreen.value = sub
            }
        )
    }
}
