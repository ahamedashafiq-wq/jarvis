package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun SignupScreen(
    authManager: AuthManager,
    onNavigateToLogin: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val authState by authManager.authState.collectAsState()
    val errorMsg by authManager.errorMessage.collectAsState()

    var displayName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    var signupSuccessStage by remember { mutableStateOf(0) }
    val isLoading = authState == AuthState.AUTHENTICATING

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .imePadding()
            .testTag("signup_screen"),
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
            AIOrb(
                state = if (signupSuccessStage > 0) AIOrbState.SUCCESS else if (isLoading) AIOrbState.THINKING else AIOrbState.IDLE,
                size = 110.dp
            )

            Spacer(modifier = Modifier.height(18.dp))

            Text(
                text = "JARVIS ZORO EDITION",
                color = JarvisBright,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.5.sp
            )

            Text(
                text = "CREATE JARVIS PROFILE",
                color = JarvisTextPrimary,
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Post-signup success sequence
            if (signupSuccessStage > 0) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(JarvisPanel)
                        .border(1.dp, JarvisBright, RoundedCornerShape(8.dp))
                        .padding(16.dp)
                        .testTag("signup_success_card")
                ) {
                    Column(horizontalAlignment = Alignment.Start) {
                        if (signupSuccessStage >= 1) {
                            TacticalSuccessLine("PROFILE INITIALIZED")
                        }
                        if (signupSuccessStage >= 2) {
                            TacticalSuccessLine("AI CORE READY")
                        }
                        if (signupSuccessStage >= 3) {
                            TacticalSuccessLine("MEMORY CORE READY")
                        }
                        if (signupSuccessStage >= 4) {
                            TacticalSuccessLine("COMMAND CENTER READY")
                        }
                    }
                }
            } else {
                // Error banner
                if (errorMsg != null && authState == AuthState.ERROR) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(JarvisDanger.copy(alpha = 0.15f))
                            .border(1.dp, JarvisDanger, RoundedCornerShape(8.dp))
                            .padding(10.dp)
                    ) {
                        Text(
                            text = errorMsg ?: "REGISTRATION REJECTED",
                            color = JarvisDanger,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Fields Card
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
                            value = displayName,
                            onValueChange = { displayName = it },
                            label = { Text("Display Name / Callsign", fontFamily = FontFamily.Monospace) },
                            leadingIcon = {
                                Icon(Icons.Default.Person, contentDescription = null, tint = JarvisTextMuted, modifier = Modifier.size(18.dp))
                            },
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
                            modifier = Modifier.fillMaxWidth().testTag("signup_display_name_input")
                        )

                        Spacer(modifier = Modifier.height(10.dp))

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
                            modifier = Modifier.fillMaxWidth().testTag("signup_email_input")
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            label = { Text("Password (Min 6 Characters)", fontFamily = FontFamily.Monospace) },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = JarvisTextMuted, modifier = Modifier.size(18.dp))
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
                            modifier = Modifier.fillMaxWidth().testTag("signup_password_input")
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = confirmPassword,
                            onValueChange = { confirmPassword = it },
                            label = { Text("Confirm Password", fontFamily = FontFamily.Monospace) },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = JarvisTextMuted, modifier = Modifier.size(18.dp))
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
                            modifier = Modifier.fillMaxWidth().testTag("signup_confirm_password_input")
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Action Button
                Button(
                    onClick = {
                        coroutineScope.launch {
                            val ok = authManager.signup(displayName, email, password, confirmPassword)
                            if (ok) {
                                for (i in 1..4) {
                                    signupSuccessStage = i
                                    delay(250)
                                }
                            }
                        }
                    },
                    enabled = !isLoading && email.isNotBlank() && password.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = JarvisPrimary,
                        contentColor = JarvisBackground,
                        disabledContainerColor = JarvisPanelBorder,
                        disabledContentColor = JarvisTextMuted
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("signup_submit_button")
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = JarvisBackground, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("INITIALIZING PROFILE...", fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                    } else {
                        Text("INITIALIZE PROFILE", fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                TextButton(
                    onClick = onNavigateToLogin,
                    modifier = Modifier.testTag("signup_goto_login_button")
                ) {
                    Text(
                        text = "Already have authorization? Terminal Login",
                        color = JarvisBright,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

@Composable
private fun TacticalSuccessLine(text: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 3.dp)
    ) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = JarvisBright, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            color = JarvisBright,
            fontFamily = FontFamily.Monospace,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
