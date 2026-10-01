package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.MessageEntity
import com.example.ui.JarvisViewModel
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ChatScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val conversations by viewModel.conversations.collectAsState()
    val currentConvId by viewModel.currentConversationId.collectAsState()
    val messages by viewModel.currentMessages.collectAsState()
    val isStreaming by viewModel.isStreamingActive.collectAsState()

    var inputText by remember { mutableStateOf("") }
    var showHistoryMenu by remember { mutableStateOf(false) }
    var showAttachDialog by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    val currentConvTitle = conversations.firstOrNull { it.id == currentConvId }?.title ?: "Tactical Channel"

    // Auto-scroll on new messages
    LaunchedEffect(messages.size, messages.lastOrNull()?.content?.length) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .imePadding()
            .testTag("chat_screen")
    ) {
        // Chat Channel Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(JarvisPanel)
                .border(1.dp, JarvisPanelBorder)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .weight(1f)
                    .clickable { showHistoryMenu = true }
            ) {
                Icon(
                    imageVector = Icons.Default.History,
                    contentDescription = "Conversations",
                    tint = JarvisBright,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = currentConvTitle,
                        color = JarvisTextPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        maxLines = 1
                    )
                    Text(
                        text = "ACTIVE PROTOCOL • ${messages.size} DIRECTIVES",
                        color = JarvisTextMuted,
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }

                DropdownMenu(
                    expanded = showHistoryMenu,
                    onDismissRequest = { showHistoryMenu = false },
                    modifier = Modifier.background(JarvisPanelElevated)
                ) {
                    DropdownMenuItem(
                        text = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Add, contentDescription = null, tint = JarvisBright, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("New Session", color = JarvisBright, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                            }
                        },
                        onClick = {
                            viewModel.startNewConversation()
                            showHistoryMenu = false
                        }
                    )
                    conversations.forEach { conv ->
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = conv.title,
                                    color = if (conv.id == currentConvId) JarvisBright else JarvisTextPrimary,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp,
                                    maxLines = 1
                                )
                            },
                            trailingIcon = {
                                IconButton(
                                    onClick = { viewModel.deleteConversation(conv.id) },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = JarvisDanger, modifier = Modifier.size(14.dp))
                                }
                            },
                            onClick = {
                                viewModel.selectConversation(conv.id)
                                showHistoryMenu = false
                            }
                        )
                    }
                }
            }

            Row {
                IconButton(
                    onClick = { viewModel.startNewConversation() },
                    modifier = Modifier.testTag("chat_new_session_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "New Session",
                        tint = JarvisBright,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }

        // Messages List
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 12.dp),
            contentPadding = PaddingValues(vertical = 12.dp)
        ) {
            items(messages, key = { it.id }) { message ->
                MessageBubble(
                    message = message,
                    onSpeak = { viewModel.voiceManager.speak(message.content) },
                    onCopy = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText("JARVIS Message", message.content))
                        Toast.makeText(context, "Copied to tactical buffer", Toast.LENGTH_SHORT).show()
                    },
                    onRegenerate = {
                        if (message.role == "assistant") {
                            val userPrev = messages.takeWhile { it.id != message.id }.lastOrNull { it.role == "user" }
                            if (userPrev != null) {
                                viewModel.sendMessage(userPrev.content)
                            }
                        }
                    }
                )
                Spacer(modifier = Modifier.height(10.dp))
            }
        }

        // Streaming indicator bar
        if (isStreaming) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(JarvisPanel)
                    .border(1.dp, JarvisPanelBorder)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(
                        color = JarvisBright,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "JARVIS IS STREAMING DIRECTIVE...",
                        color = JarvisBright,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }

                IconButton(
                    onClick = { viewModel.stopStreaming() },
                    modifier = Modifier
                        .size(28.dp)
                        .testTag("chat_stop_streaming_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Stop,
                        contentDescription = "Stop",
                        tint = JarvisDanger,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        // Chat Input Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(JarvisPanel)
                .border(1.dp, JarvisPanelBorder)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Attachment Button
            IconButton(
                onClick = { showAttachDialog = true },
                modifier = Modifier.testTag("chat_attach_button")
            ) {
                Icon(
                    imageVector = Icons.Default.AttachFile,
                    contentDescription = "Attach File",
                    tint = JarvisTextSecondary,
                    modifier = Modifier.size(20.dp)
                )
            }

            // Text Input
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                placeholder = {
                    Text(
                        text = "Enter directive or natural command...",
                        color = JarvisTextMuted,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    )
                },
                modifier = Modifier
                    .weight(1f)
                    .testTag("chat_input_field"),
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
                maxLines = 4
            )

            Spacer(modifier = Modifier.width(4.dp))

            // Voice Speech-To-Text mic button
            IconButton(
                onClick = {
                    viewModel.voiceManager.startListening { voiceResult ->
                        inputText = voiceResult
                    }
                },
                modifier = Modifier.testTag("chat_voice_input_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Mic,
                    contentDescription = "Voice Input",
                    tint = JarvisBright,
                    modifier = Modifier.size(20.dp)
                )
            }

            // Send Button
            IconButton(
                onClick = {
                    if (inputText.isNotBlank()) {
                        viewModel.sendMessage(inputText)
                        inputText = ""
                    }
                },
                modifier = Modifier.testTag("chat_send_button")
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Send",
                    tint = JarvisPrimary,
                    modifier = Modifier.size(22.dp)
                )
            }
        }
    }

    // Attachment Modal (Multimodal architecture)
    if (showAttachDialog) {
        AlertDialog(
            onDismissRequest = { showAttachDialog = false },
            containerColor = JarvisPanelElevated,
            title = {
                Text("ATTACH MULTIMODAL CONTEXT", color = JarvisBright, fontSize = 14.sp, fontFamily = FontFamily.Monospace)
            },
            text = {
                Column {
                    Text(
                        text = "Select data stream format to attach to Gemini reasoning pipeline:",
                        color = JarvisTextSecondary,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    listOf(
                        "Tactical Image / Screenshot Analysis",
                        "Codebase / Architecture Spec (.kt / .json)",
                        "Mission Log Transcript (.txt)",
                        "Tactical Map / Blueprint Schema"
                    ).forEach { opt ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(JarvisPanel)
                                .border(1.dp, JarvisPanelBorder, RoundedCornerShape(6.dp))
                                .clickable {
                                    inputText = "Analyze attached telemetry: $opt\n"
                                    showAttachDialog = false
                                }
                                .padding(10.dp)
                        ) {
                            Text(text = "• $opt", color = JarvisTextPrimary, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showAttachDialog = false }) {
                    Text("CLOSE", color = JarvisTextMuted, fontFamily = FontFamily.Monospace)
                }
            }
        )
    }
}

@Composable
private fun MessageBubble(
    message: MessageEntity,
    onSpeak: () -> Unit,
    onCopy: () -> Unit,
    onRegenerate: () -> Unit
) {
    val isUser = message.role == "user"
    val timeStr = remember(message.timestamp) {
        SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(message.timestamp))
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        if (!isUser) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(JarvisPrimary.copy(alpha = 0.2f))
                    .border(1.dp, JarvisBright, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = JarvisBright,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        Column(
            modifier = Modifier.fillMaxWidth(0.88f),
            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
        ) {
            // Header info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = if (isUser) "COMMANDER" else "JARVIS ZORO",
                    color = if (isUser) JarvisTextSecondary else JarvisBright,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = timeStr,
                    color = JarvisTextMuted,
                    fontSize = 8.sp,
                    fontFamily = FontFamily.Monospace
                )
            }

            Spacer(modifier = Modifier.height(2.dp))

            // Bubble body
            Box(
                modifier = Modifier
                    .clip(
                        RoundedCornerShape(
                            topStart = 10.dp,
                            topEnd = 10.dp,
                            bottomStart = if (isUser) 10.dp else 2.dp,
                            bottomEnd = if (isUser) 2.dp else 10.dp
                        )
                    )
                    .background(if (isUser) JarvisPanelElevated else JarvisPanel)
                    .border(1.dp, if (isUser) JarvisPanelBorder else JarvisPrimary.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                    .padding(12.dp)
            ) {
                Column {
                    Text(
                        text = message.content,
                        color = JarvisTextPrimary,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )

                    // Intent badge if attached
                    if (message.intentTag != null) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(JarvisBright.copy(alpha = 0.15f))
                                .border(1.dp, JarvisBright, RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = message.intentTag,
                                color = JarvisBright,
                                fontSize = 9.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Assistant message action buttons (Speak, Copy, Regenerate)
            if (!isUser && !message.isStreaming) {
                Row(
                    modifier = Modifier.padding(top = 2.dp),
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    IconButton(onClick = onSpeak, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = "Speak", tint = JarvisTextMuted, modifier = Modifier.size(13.dp))
                    }
                    IconButton(onClick = onCopy, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy", tint = JarvisTextMuted, modifier = Modifier.size(13.dp))
                    }
                    IconButton(onClick = onRegenerate, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Refresh, contentDescription = "Regenerate", tint = JarvisTextMuted, modifier = Modifier.size(13.dp))
                    }
                }
            }
        }
    }
}
