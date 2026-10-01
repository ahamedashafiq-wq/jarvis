package com.example.ui.screens

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Terminal
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.CommandLogEntity
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

@Composable
fun CommandsScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val commandLogs by viewModel.commandLogs.collectAsState()
    var inputCmd by remember { mutableStateOf("") }

    val quickCommands = listOf("/help", "/status", "/tasks", "/memory", "/focus 25", "/analytics", "/profile", "/settings", "/clear")

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .imePadding()
            .padding(horizontal = 16.dp)
            .testTag("commands_screen")
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        // Command Center Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Terminal,
                    contentDescription = null,
                    tint = JarvisBright,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "TACTICAL CLI TERMINAL",
                        color = JarvisBright,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "PIPELINE: INPUT → INTENT → VALIDATING → EXECUTION",
                        color = JarvisTextMuted,
                        fontSize = 8.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            TextButton(onClick = { viewModel.executeCommand("/clear") }) {
                Text("CLEAR", color = JarvisTextMuted, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Quick Command Chips
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(quickCommands) { cmd ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(JarvisPanel)
                        .border(1.dp, JarvisPanelBorder, RoundedCornerShape(4.dp))
                        .clickable { viewModel.executeCommand(cmd) }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                        .testTag("chip_$cmd")
                ) {
                    Text(
                        text = cmd,
                        color = JarvisBright,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Terminal Log Area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(JarvisPanel)
                .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                .padding(10.dp)
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 16.dp),
                reverseLayout = false
            ) {
                if (commandLogs.isEmpty()) {
                    item {
                        Text(
                            text = """JARVIS ZORO COMMAND TERMINAL v1.0
Type /help for operational syntax.
Standing by for operator commands...""",
                            color = JarvisTextMuted,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            lineHeight = 16.sp
                        )
                    }
                } else {
                    items(commandLogs) { log ->
                        CommandLineItem(log = log)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Command Prompt Input
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 96.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = inputCmd,
                onValueChange = { inputCmd = it },
                leadingIcon = {
                    Text(
                        text = "JARVIS:~$ ",
                        color = JarvisBright,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(start = 10.dp)
                    )
                },
                placeholder = {
                    Text("command...", color = JarvisTextMuted, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                },
                modifier = Modifier
                    .weight(1f)
                    .testTag("terminal_input_field"),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = JarvisBright,
                    unfocusedTextColor = JarvisBright,
                    focusedBorderColor = JarvisBright,
                    unfocusedBorderColor = JarvisPanelBorder,
                    cursorColor = JarvisBright,
                    focusedContainerColor = JarvisPanelElevated,
                    unfocusedContainerColor = JarvisPanelElevated
                ),
                shape = RoundedCornerShape(8.dp),
                singleLine = true
            )

            Spacer(modifier = Modifier.width(6.dp))

            IconButton(
                onClick = {
                    if (inputCmd.isNotBlank()) {
                        viewModel.executeCommand(inputCmd)
                        inputCmd = ""
                    }
                },
                modifier = Modifier.testTag("terminal_submit_button")
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Execute",
                    tint = JarvisPrimary,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

@Composable
private fun CommandLineItem(log: CommandLogEntity) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "JARVIS:~$ ${log.command}",
                color = JarvisTextPrimary,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(3.dp))
                    .background(
                        when (log.status) {
                            "SUCCESS" -> JarvisBright.copy(alpha = 0.2f)
                            "ERROR" -> JarvisDanger.copy(alpha = 0.2f)
                            else -> JarvisWarning.copy(alpha = 0.2f)
                        }
                    )
                    .padding(horizontal = 4.dp, vertical = 1.dp)
            ) {
                Text(
                    text = log.status,
                    color = when (log.status) {
                        "SUCCESS" -> JarvisBright
                        "ERROR" -> JarvisDanger
                        else -> JarvisWarning
                    },
                    fontSize = 8.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(2.dp))

        Text(
            text = log.output,
            color = JarvisTextSecondary,
            fontFamily = FontFamily.Monospace,
            fontSize = 10.sp,
            lineHeight = 14.sp
        )
    }
}
