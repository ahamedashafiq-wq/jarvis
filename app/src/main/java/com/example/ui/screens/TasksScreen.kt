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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import com.example.data.model.TaskEntity
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
fun TasksScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val tasks by viewModel.allTasks.collectAsState()
    var selectedFilter by remember { mutableStateOf("ALL") }
    var searchQuery by remember { mutableStateOf("") }
    var showCreateDialog by remember { mutableStateOf(false) }

    val filterOptions = listOf("ALL", "TODAY", "UPCOMING", "COMPLETED", "CRITICAL")

    val filteredTasks = tasks.filter { task ->
        val matchesFilter = when (selectedFilter) {
            "ALL" -> true
            "TODAY" -> task.dueDate.equals("Today", ignoreCase = true)
            "UPCOMING" -> task.dueDate.isNotBlank() && !task.dueDate.equals("Today", ignoreCase = true)
            "COMPLETED" -> task.status == "COMPLETED"
            "CRITICAL" -> task.priority == "CRITICAL"
            else -> true
        }
        val matchesSearch = searchQuery.isBlank() || task.title.contains(searchQuery, ignoreCase = true) || task.description.contains(searchQuery, ignoreCase = true)
        matchesFilter && matchesSearch
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .testTag("tasks_screen")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Screen Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "TACTICAL DIRECTIVES (BLADE 02)",
                        color = JarvisBright,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "${filteredTasks.size} OBJECTIVES LOADED",
                        color = JarvisTextMuted,
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = {
                    Text(
                        text = "Filter operations & objectives...",
                        color = JarvisTextMuted,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = JarvisTextMuted,
                        modifier = Modifier.size(18.dp)
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("tasks_search_input"),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = JarvisTextPrimary,
                    unfocusedTextColor = JarvisTextPrimary,
                    focusedBorderColor = JarvisBright,
                    unfocusedBorderColor = JarvisPanelBorder,
                    cursorColor = JarvisBright,
                    focusedContainerColor = JarvisPanel,
                    unfocusedContainerColor = JarvisPanel
                ),
                shape = RoundedCornerShape(8.dp),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Filter Chips Row
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(filterOptions) { filter ->
                    val isSelected = selectedFilter == filter
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) JarvisPrimary else JarvisPanel)
                            .border(1.dp, if (isSelected) JarvisBright else JarvisPanelBorder, RoundedCornerShape(6.dp))
                            .clickable { selectedFilter = filter }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                            .testTag("filter_$filter")
                    ) {
                        Text(
                            text = filter,
                            color = if (isSelected) JarvisBackground else JarvisTextSecondary,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Tasks List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 96.dp)
            ) {
                if (filteredTasks.isEmpty()) {
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
                                text = "NO DIRECTIVES IN THIS CLASSIFICATION",
                                color = JarvisTextMuted,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                } else {
                    items(filteredTasks, key = { it.id }) { task ->
                        TaskItemCard(
                            task = task,
                            onToggle = { viewModel.toggleTaskComplete(task) },
                            onDelete = { viewModel.deleteTask(task.id) }
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }

        // FAB to add new task
        FloatingActionButton(
            onClick = { showCreateDialog = true },
            containerColor = JarvisPrimary,
            contentColor = JarvisBackground,
            shape = CircleShape,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = 72.dp, end = 20.dp)
                .testTag("tasks_add_fab")
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Task")
        }
    }

    // Create Task Modal
    if (showCreateDialog) {
        var title by remember { mutableStateOf("") }
        var description by remember { mutableStateOf("") }
        var priority by remember { mutableStateOf("HIGH") }
        var dueDate by remember { mutableStateOf("Today") }

        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            containerColor = JarvisPanelElevated,
            title = {
                Text(
                    text = "DEPLOY NEW DIRECTIVE",
                    color = JarvisBright,
                    fontSize = 14.sp,
                    fontFamily = FontFamily.Monospace
                )
            },
            text = {
                Column {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Directive Title") },
                        modifier = Modifier.fillMaxWidth().testTag("new_task_title_input")
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Operational Details") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("PRIORITY LEVEL", color = JarvisTextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("LOW", "MEDIUM", "HIGH", "CRITICAL").forEach { prio ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (priority == prio) JarvisPrimary else JarvisPanel)
                                    .border(1.dp, JarvisPanelBorder, RoundedCornerShape(4.dp))
                                    .clickable { priority = prio }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = prio,
                                    color = if (priority == prio) JarvisBackground else JarvisTextPrimary,
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = dueDate,
                        onValueChange = { dueDate = it },
                        label = { Text("Target Due Date (e.g. Today, Tomorrow)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank()) {
                            viewModel.createTask(title, description, priority, dueDate)
                        }
                        showCreateDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisPrimary)
                ) {
                    Text("AUTHORIZE", color = JarvisBackground, fontFamily = FontFamily.Monospace)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("ABORT", color = JarvisTextMuted, fontFamily = FontFamily.Monospace)
                }
            }
        )
    }
}

@Composable
private fun TaskItemCard(
    task: TaskEntity,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    val isCompleted = task.status == "COMPLETED"

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(JarvisPanel)
            .border(1.dp, if (isCompleted) JarvisPanelBorder else JarvisPanelBorder, RoundedCornerShape(8.dp))
            .padding(12.dp)
            .testTag("task_item_${task.id}")
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top
        ) {
            IconButton(
                onClick = onToggle,
                modifier = Modifier
                    .size(24.dp)
                    .testTag("task_checkbox_${task.id}")
            ) {
                Icon(
                    imageVector = if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                    contentDescription = "Toggle Complete",
                    tint = if (isCompleted) JarvisBright else JarvisTextMuted,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    color = if (isCompleted) JarvisTextMuted else JarvisTextPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )

                if (task.description.isNotBlank()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = task.description,
                        color = JarvisTextSecondary,
                        fontSize = 11.sp
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Priority Pill
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(
                                when (task.priority) {
                                    "CRITICAL" -> JarvisDanger.copy(alpha = 0.2f)
                                    "HIGH" -> JarvisWarning.copy(alpha = 0.2f)
                                    else -> JarvisPrimary.copy(alpha = 0.2f)
                                }
                            )
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = task.priority,
                            color = when (task.priority) {
                                "CRITICAL" -> JarvisDanger
                                "HIGH" -> JarvisWarning
                                else -> JarvisPrimary
                            },
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    if (task.dueDate.isNotBlank()) {
                        Text(
                            text = "DUE: ${task.dueDate}",
                            color = JarvisTextMuted,
                            fontSize = 8.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            IconButton(
                onClick = onDelete,
                modifier = Modifier
                    .size(28.dp)
                    .testTag("task_delete_${task.id}")
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete Directive",
                    tint = JarvisTextMuted,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
