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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.PushPin
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.FloatingActionButton
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
import com.example.data.model.MemoryEntity
import com.example.ui.JarvisViewModel
import com.example.ui.SubScreen
import com.example.ui.theme.BladeMemory
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
fun MemoryScreen(
    viewModel: JarvisViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val memories by viewModel.allMemories.collectAsState()
    var selectedCategory by remember { mutableStateOf("ALL") }
    var searchQuery by remember { mutableStateOf("") }
    var showCreateDialog by remember { mutableStateOf(false) }
    var showClearConfirm by remember { mutableStateOf(false) }

    val categories = listOf("ALL", "PROFILE", "PREFERENCE", "PROJECT", "ACADEMIC", "IMPORTANT_DATE", "GENERAL")

    val filtered = memories.filter { mem ->
        val matchesCat = selectedCategory == "ALL" || mem.category.equals(selectedCategory, ignoreCase = true)
        val matchesSearch = searchQuery.isBlank() || mem.content.contains(searchQuery, ignoreCase = true)
        matchesCat && matchesSearch
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .testTag("memory_screen")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("memory_back_button")) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = BladeMemory
                        )
                    }
                    Spacer(modifier = Modifier.width(4.dp))
                    Column {
                        Text(
                            text = "PERSISTENT MEMORY (BLADE 03)",
                            color = BladeMemory,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "${filtered.size} NODES SECURED IN SQLITE ROOM",
                            color = JarvisTextMuted,
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                TextButton(onClick = { showClearConfirm = true }) {
                    Text("PURGE", color = JarvisDanger, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = {
                    Text(
                        text = "Query memory index...",
                        color = JarvisTextMuted,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    )
                },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = "Search", tint = JarvisTextMuted, modifier = Modifier.size(18.dp))
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("memory_search_input"),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = JarvisTextPrimary,
                    unfocusedTextColor = JarvisTextPrimary,
                    focusedBorderColor = BladeMemory,
                    unfocusedBorderColor = JarvisPanelBorder,
                    cursorColor = BladeMemory,
                    focusedContainerColor = JarvisPanel,
                    unfocusedContainerColor = JarvisPanel
                ),
                shape = RoundedCornerShape(8.dp),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Category Chips Row
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(categories) { cat ->
                    val isSelected = selectedCategory == cat
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) BladeMemory else JarvisPanel)
                            .border(1.dp, if (isSelected) BladeMemory else JarvisPanelBorder, RoundedCornerShape(6.dp))
                            .clickable { selectedCategory = cat }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                            .testTag("memory_cat_$cat")
                    ) {
                        Text(
                            text = cat,
                            color = if (isSelected) JarvisBackground else JarvisTextSecondary,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Memories List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 96.dp)
            ) {
                if (filtered.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(JarvisPanel)
                                .border(1.dp, JarvisPanelBorder, RoundedCornerShape(8.dp))
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "NO MEMORIES RECORDED UNDER THIS FILTER",
                                color = JarvisTextMuted,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                } else {
                    items(filtered, key = { it.id }) { memory ->
                        MemoryItemCard(
                            memory = memory,
                            onTogglePin = { viewModel.toggleMemoryPin(memory) },
                            onDelete = { viewModel.deleteMemory(memory.id) }
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }

        // Add Memory FAB
        FloatingActionButton(
            onClick = { showCreateDialog = true },
            containerColor = BladeMemory,
            contentColor = JarvisBackground,
            shape = CircleShape,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = 72.dp, end = 20.dp)
                .testTag("memory_add_fab")
        ) {
            Icon(Icons.Default.Add, contentDescription = "Store Memory")
        }
    }

    // Create Memory Modal
    if (showCreateDialog) {
        var content by remember { mutableStateOf("") }
        var category by remember { mutableStateOf("PROJECT") }
        var importance by remember { mutableStateOf("HIGH") }
        var isPinned by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            containerColor = JarvisPanelElevated,
            title = {
                Text(
                    text = "COMMIT TO MEMORY BANK",
                    color = BladeMemory,
                    fontSize = 14.sp,
                    fontFamily = FontFamily.Monospace
                )
            },
            text = {
                Column {
                    OutlinedTextField(
                        value = content,
                        onValueChange = { content = it },
                        label = { Text("Information / Preference / Context") },
                        modifier = Modifier.fillMaxWidth().testTag("new_memory_content_input")
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("CATEGORY", color = JarvisTextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    Spacer(modifier = Modifier.height(4.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        items(listOf("PROFILE", "PREFERENCE", "PROJECT", "ACADEMIC", "IMPORTANT_DATE", "GENERAL")) { cat ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (category == cat) BladeMemory else JarvisPanel)
                                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(4.dp))
                                    .clickable { category = cat }
                                    .padding(horizontal = 6.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = cat,
                                    color = if (category == cat) JarvisBackground else JarvisTextPrimary,
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = isPinned,
                            onCheckedChange = { isPinned = it },
                            colors = CheckboxDefaults.colors(checkedColor = BladeMemory)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Pin to top priority recall",
                            color = JarvisTextPrimary,
                            fontSize = 11.sp
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (content.isNotBlank()) {
                            viewModel.createMemory(content, category, importance, isPinned)
                        }
                        showCreateDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BladeMemory)
                ) {
                    Text("SECURE", color = JarvisBackground, fontFamily = FontFamily.Monospace)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("CANCEL", color = JarvisTextMuted, fontFamily = FontFamily.Monospace)
                }
            }
        )
    }

    // Purge confirmation dialog
    if (showClearConfirm) {
        AlertDialog(
            onDismissRequest = { showClearConfirm = false },
            containerColor = JarvisPanelElevated,
            title = {
                Text("PURGE MEMORY BANK?", color = JarvisDanger, fontSize = 14.sp, fontFamily = FontFamily.Monospace)
            },
            text = {
                Text(
                    text = "This will erase all persistent knowledge entries stored in Blade 03. This operation cannot be reversed.",
                    color = JarvisTextSecondary,
                    fontSize = 12.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.clearAllMemories()
                        showClearConfirm = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisDanger)
                ) {
                    Text("PURGE ALL", color = JarvisTextPrimary, fontFamily = FontFamily.Monospace)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearConfirm = false }) {
                    Text("CANCEL", color = JarvisTextMuted, fontFamily = FontFamily.Monospace)
                }
            }
        )
    }
}

@Composable
private fun MemoryItemCard(
    memory: MemoryEntity,
    onTogglePin: () -> Unit,
    onDelete: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(JarvisPanel)
            .border(1.dp, if (memory.isPinned) BladeMemory.copy(alpha = 0.6f) else JarvisPanelBorder, RoundedCornerShape(8.dp))
            .padding(12.dp)
            .testTag("memory_item_${memory.id}")
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = Icons.Default.Psychology,
                contentDescription = null,
                tint = BladeMemory,
                modifier = Modifier
                    .size(20.dp)
                    .padding(top = 2.dp)
            )

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(BladeMemory.copy(alpha = 0.15f))
                            .border(1.dp, BladeMemory.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = memory.category,
                            color = BladeMemory,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    if (memory.isPinned) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "★ PINNED",
                            color = JarvisWarning,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = memory.content,
                    color = JarvisTextPrimary,
                    fontSize = 12.sp,
                    lineHeight = 17.sp
                )
            }

            Row {
                IconButton(onClick = onTogglePin, modifier = Modifier.size(24.dp)) {
                    Icon(
                        imageVector = if (memory.isPinned) Icons.Filled.PushPin else Icons.Outlined.PushPin,
                        contentDescription = "Pin Memory",
                        tint = if (memory.isPinned) JarvisWarning else JarvisTextMuted,
                        modifier = Modifier.size(16.dp)
                    )
                }

                IconButton(onClick = onDelete, modifier = Modifier.size(24.dp)) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete Memory",
                        tint = JarvisTextMuted,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
