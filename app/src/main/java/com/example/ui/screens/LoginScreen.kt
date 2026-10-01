package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.auth.AuthManager
import com.example.data.auth.AuthState
import com.example.ui.components.AIOrb
import com.example.ui.components.AIOrbState
import com.example.ui.theme.JarvisBackground
import com.example.ui.theme.JarvisBright
import com.example.ui.theme.JarvisDanger
import com.example.ui.theme.JarvisPanel
import com.example.ui.theme.JarvisPanelBorder
import com.example.ui.theme.JarvisPanelElevated
import com.example.ui.theme.JarvisPrimary
import com.example.ui.theme.JarvisTextMuted
import com.example.ui.theme.JarvisTextPrimary
import com.example.ui.theme.JarvisTextSecondary
import com.example.ui.theme.JarvisWarning
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    authManager: AuthManager,
    onNavigateToSignup: () -> Unit,
    onNavigateToForgotPassword: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val authState by authManager.authState.collectAsState()
    val errorMsg by authManager.errorMessage.collectAsState()
    val isConfigured = authManager.isSupabaseConfigured

    var email by remember { mutableStateOf("commander@jarvis.ai") }
    var password by remember { mutableStateOf("tactical123") }
    var passwordVisible by remember { mutableStateOf(false) }
    var showConfigModal by remember { mutableStateOf(false) }

    val isLoading = authState == AuthState.AUTHENTICATING

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .imePadding()
            .testTag("login_screen"),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Tactical Brand Header
            AIOrb(
                state = if (isLoading) AIOrbState.THINKING else if (authState == AuthState.ERROR) AIOrbState.ERROR else AIOrbState.IDLE,
                size = 110.dp
            )

            Spacer(modifier = Modifier.height(18.dp))

            Text(
                text = "JARVIS",
                color = JarvisTextPrimary,
                fontSize = 26.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 2.sp
            )
            Text(
                text = "ZORO EDITION",
                color = JarvisBright,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.2.sp
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "AUTHENTICATION REQUIRED",
                color = JarvisTextMuted,
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Supabase / Database Status Banner
            if (!isConfigured) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(JarvisWarning.copy(alpha = 0.12f))
                        .border(1.dp, JarvisWarning.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                        .clickable { showConfigModal = true }
                        .padding(10.dp)
                        .testTag("db_config_required_banner")
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = JarvisWarning, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "DATABASE CONFIGURATION REQUIRED",
                                color = JarvisWarning,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "Supabase env unlinked. Operating in Local Multi-User Secure Sandbox. Tap to view details.",
                                color = JarvisTextSecondary,
                                fontSize = 9.sp
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Error Banner
            if (errorMsg != null && authState == AuthState.ERROR) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(JarvisDanger.copy(alpha = 0.15f))
                        .border(1.dp, JarvisDanger, RoundedCornerShape(8.dp))
                        .padding(10.dp)
                        .testTag("login_error_banner")
                ) {
                    Text(
                        text = errorMsg ?: "ACCESS DENIED",
                        color = JarvisDanger,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Input Fields Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(10.dp))
                    .padding(16.dp)
            ) {
                Column {
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email Directive", fontFamily = FontFamily.Monospace) },
                        leadingIcon = {
                            Icon(Icons.Default.Mail, contentDescription = null, tint = JarvisTextMuted, modifier = Modifier.size(18.dp))
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = JarvisTextPrimary,
                            unfocusedTextColor = JarvisTextPrimary,
                            focusedBorderColor = JarvisBright,
                            unfocusedBorderColor = JarvisPanelBorder,
                            cursorColor = JarvisBright,
                            focusedContainerColor = JarvisPanelElevated,
                            unfocusedContainerColor = JarvisPanelElevated
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("login_email_input")
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password Matrix", fontFamily = FontFamily.Monospace) },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = JarvisTextMuted, modifier = Modifier.size(18.dp))
                        },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = "Toggle password",
                                    tint = JarvisTextMuted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = JarvisTextPrimary,
                            unfocusedTextColor = JarvisTextPrimary,
                            focusedBorderColor = JarvisBright,
                            unfocusedBorderColor = JarvisPanelBorder,
                            cursorColor = JarvisBright,
                            focusedContainerColor = JarvisPanelElevated,
                            unfocusedContainerColor = JarvisPanelElevated
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("login_password_input")
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Quick One-Tap Demo Access Button
            Button(
                onClick = {
                    coroutineScope.launch {
                        authManager.quickDemoLogin()
                    }
                },
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = JarvisBright,
                    contentColor = JarvisBackground
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("login_demo_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = JarvisBackground,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "ONE-TAP INSTANT ACCESS",
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Action Button
            Button(
                onClick = {
                    coroutineScope.launch {
                        val submitEmail = email.ifBlank { "commander@jarvis.ai" }
                        val submitPass = password.ifBlank { "tactical123" }
                        authManager.login(submitEmail, submitPass)
                    }
                },
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = JarvisPanelBorder,
                    contentColor = JarvisTextPrimary
                ),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("login_submit_button")
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        color = JarvisBright,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "AUTHENTICATING...",
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    )
                } else {
                    Text(
                        text = "INITIALIZE WITH CREDENTIALS",
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "DEFAULT OPERATOR: commander@jarvis.ai / tactical123",
                color = JarvisTextMuted,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Navigation Links
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(
                    onClick = onNavigateToSignup,
                    modifier = Modifier.testTag("login_goto_signup_button")
                ) {
                    Text(
                        text = "Create Account",
                        color = JarvisBright,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }

                TextButton(
                    onClick = onNavigateToForgotPassword,
                    modifier = Modifier.testTag("login_goto_forgot_button")
                ) {
                    Text(
                        text = "Forgot Password",
                        color = JarvisTextSecondary,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }

    // Database Configuration Modal
    if (showConfigModal) {
        var customUrl by remember { mutableStateOf(authManager.supabaseService.supabaseUrl) }
        var customKey by remember { mutableStateOf(authManager.supabaseService.supabaseAnonKey) }

        androidx.compose.material3.AlertDialog(
            onDismissRequest = { showConfigModal = false },
            containerColor = JarvisPanelElevated,
            title = {
                Text("DATABASE CONFIGURATION", color = JarvisWarning, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
            },
            text = {
                Column {
                    Text(
                        text = "To sync with an external PostgreSQL Supabase backend, supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in AI Studio Secrets or input below:",
                        color = JarvisTextSecondary,
                        fontSize = 11.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = customUrl,
                        onValueChange = { customUrl = it },
                        label = { Text("Supabase URL") },
                        placeholder = { Text("https://xyz.supabase.co") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = customKey,
                        onValueChange = { customKey = it },
                        label = { Text("Supabase Anon Key") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        authManager.supabaseService.setCustomCredentials(customUrl, customKey)
                        showConfigModal = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisPrimary)
                ) {
                    Text("SAVE & CONNECT", color = JarvisBackground, fontFamily = FontFamily.Monospace, fontSize = 11.sp)
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfigModal = false }) {
                    Text("USE LOCAL SANDBOX", color = JarvisTextMuted, fontFamily = FontFamily.Monospace, fontSize = 11.sp)
                }
            }
        )
    }
}
