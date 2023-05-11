document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('task-form').addEventListener('submit', addTask);
    document.getElementById('submit-work-flow').addEventListener('click', function (event) {
        submitWorkFlowName(event);
        clearInputFields();
    });

    createLikebuttonsOnLoad();
    addTaskCellEventListeners();
});

let currentWorkFlowButton = null;

// Add a new task to the table
async function addTask(event) {
    event.preventDefault();
    const taskInput = document.getElementById('task-input');
    const task = taskInput.value.trim();

    if (task.length === 0) {
        alert('Please enter a task');
        return;
    }

    if (isTaskDuplicate(task)) {
        alert('This thing already exists in the table');
        return;
    }

    const taskId = await addTaskToServer(task);
    const tableBody = document.getElementById('task-table-body');
    const row = tableBody.insertRow();
    const taskCell = row.insertCell();
    console.log('Task cell created:', taskCell);
    const workFlowStepCell = row.insertCell();
    const toolsCell = row.insertCell();
    const chatGPTPromptsCell = row.insertCell();
    const influentialResearchCell = row.insertCell();

    taskCell.textContent = task;
    taskCell.dataset.taskId = taskId;
    taskCell.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        showTaskContextMenu(event);
    });

    [workFlowStepCell, toolsCell, chatGPTPromptsCell, influentialResearchCell].forEach(cell => {
        cell.addEventListener('click', function () {
            showWorkFlowInput(this);
        });
    });

    taskInput.value = '';
}

// Close the modal when clicking outside of it
window.onclick = function (event) {
    const workFlowInputContainer = document.getElementById('work-flow-input-container');
    if (event.target === workFlowInputContainer) {
        workFlowInputContainer.style.display = 'none';
        clearInputFields();
    };
    
};

function showTaskContextMenu(event) {
    const taskId = event.target.dataset.taskId;

    // Create a context menu with a delete option
    const contextMenu = document.createElement('ul');
    contextMenu.classList.add('task-context-menu');
    contextMenu.innerHTML = `
        <li id="delete-task" data-task-id="${taskId}">Delete</li>
        <li id="edit-task" data-task-id="${taskId}">Edit</li>
    `;
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    document.body.appendChild(contextMenu);

    // Add a click event listener to the delete option
    const deleteOption = contextMenu.querySelector('#delete-task');
    deleteOption.addEventListener('click', () => {
        deleteTask(taskId, event.target);
        contextMenu.remove();
    });

    // Add a click event listener to the edit option
    const editOption = contextMenu.querySelector('#edit-task');
    editOption.addEventListener('click', () => {
        editTask(taskId, event.target);
        contextMenu.remove();
    });

    let removeTimeoutId = setTimeout(() => {
        contextMenu.remove();
    }, 1000);
    
    contextMenu.addEventListener('mouseenter', () => {
        clearTimeout(removeTimeoutId);
    });

    // Remove the context menu when the mouse leaves the menu
    contextMenu.addEventListener('mouseleave', () => {
        contextMenu.remove();
    });
}

function deleteTask(taskId, taskCell) {
    if (confirm('Are you sure you want to delete this task?')) {
        // Remove the row containing the task cell
        const row = taskCell.closest('tr');
        row.parentElement.removeChild(row);

        // Delete the task from the server
        deleteTaskFromServer(taskId);
    }
}

async function deleteTaskFromServer(taskId) {
    const response = await fetch(`/task/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId: taskId })
    });

    if (!response.ok) {
        console.error('There was an issue deleting the task');
        console.error('Server response:', response); // Log the server response
    }
}

function editTask(taskId, taskCell) {
    const taskName = prompt('Edit task name:', taskCell.textContent);

    if (taskName.trim().length === 0) {
        alert('Please enter a valid task name');
        return;
    }

    if (isTaskDuplicate(taskName)) {
        alert('This task already exists in the table');
        return;
    }

    // Update the task cell text content
    taskCell.textContent = taskName;

    // Update the task on the server
    updateTaskOnServer(taskId, taskName);
}

// Show the input fields to add or edit workflow steps
function showWorkFlowInput(cell) {
    currentWorkFlowButton = cell;
    const workFlowInputContainer = document.getElementById('work-flow-input-container');
    const workFlowInput = document.getElementById('work-flow-input');
    const nameInput = document.getElementById('name-input');
    const modalTitle = document.getElementById('modal-title');
    let titleText;
    if (cell.cellIndex===1) {
        titleText = 'Workflow Step Input'
    } else if (cell.cellIndex===2) {titleText='Tool Input'
    } else if (cell.cellIndex===3) {titleText='ChatGPT Prompt Input'
    } else if (cell.cellIndex===4) {titleText='Research/Resource Input'
    } 


    showToolInput(cell.cellIndex === 2);
    showChatgptPromptInput(cell.cellIndex ===3);
    showResearchInput(cell.cellIndex ===4);

    let buttonContainer = currentWorkFlowButton.querySelector('.workflow-step-container');
    if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.classList.add('workflow-step-container');
        currentWorkFlowButton.appendChild(buttonContainer);
    }

    workFlowInputContainer.style.display = 'block';
    modalTitle.textContent = titleText;
    if (cell.cellIndex===1) {
        nameInput.style.display = 'none';
        workFlowInput.style.display = 'block';
        workFlowInput.focus();
    } else {
        workFlowInput.style.display = 'none';
        nameInput.style.display = 'block';
        nameInput.focus();
    }
}

// Show or hide the Github URL input based on the cell index
function showToolInput(show) {
    const githubUrlInput = document.getElementById('github-url-input');
    const toolDescriptionInput = document.getElementById('tool-description-input')
    const huggingfaceUrlInput = document.getElementById('huggingface-url-input')
    githubUrlInput.style.display = show ? 'block' : 'none';
    toolDescriptionInput.style.display = show ? 'block' : 'none';
    huggingfaceUrlInput.style.display = show ? 'block' : 'none';

}

function showChatgptPromptInput(show) {
    const chatgptPromptInput = document.getElementById('chatgpt-prompt-input');
    chatgptPromptInput.style.display = show ? 'block' : 'none';
}

function showResearchInput(show) {
    const researchDescriptionInput = document.getElementById('research-description-input');
    const researchUrlInput = document.getElementById('research-url-input')
    researchDescriptionInput.style.display = show ? 'block' : 'none';
    researchUrlInput.style.display = show ? 'block' : 'none';
}

// Handle the submission of the workflow step name
async function submitWorkFlowName(event) {
    event.preventDefault();
    const workFlowInput = document.getElementById('work-flow-input');
    const nameInput = document.getElementById('name-input');
    const toolDescriptionInput = document.getElementById('tool-description-input')
    const huggingfaceUrlInput = document.getElementById('huggingface-url-input')
    const githubUrlInput = document.getElementById('github-url-input');
    const chatgptPromptInput = document.getElementById('chatgpt-prompt-input')
    const researchDescriptionInput = document.getElementById('research-description-input')
    const researchUrlInput = document.getElementById('research-url-input')
    const toolDescription = toolDescriptionInput.value.trim()
    const name = nameInput.value.trim()
    const huggingfaceUrl = huggingfaceUrlInput.value.trim()
    const githubUrl = githubUrlInput.value.trim();
    const chatgptPrompt = chatgptPromptInput.value.trim();
    const researchDescription = researchDescriptionInput.value.trim();
    const researchUrl = researchUrlInput.value.trim(); 
    const category = getCellCategory(currentWorkFlowButton);
    let submit = document.getElementById('submit-work-flow')    
    let workflowStep_id = submit.dataset.workflowStepId
    oldButton = document.querySelector(`.like-btn[data-workflow-step-id="${workflowStep_id}"]`)

    if (category === 'workflow_step') {
        workFlowName=workFlowInput.options[workFlowInput.selectedIndex].value.trim();}
        else {workFlowName=name}

    if (isWorkflowStepNameDuplicate(workFlowName, currentWorkFlowButton)) {
        if (!oldButton) {
            alert('This name already exists in this cell');
            return;
        }
    }

    if (workFlowName.length === 0) {
        alert('Please enter a name');
        return;
    }

    
    let likes = submit.dataset.likes
    if (!likes) {likes = 0;}
    

    const taskId = getTaskId(currentWorkFlowButton);
    const data = {task_id: taskId,workflow_step_name: workFlowName,category: category,tool_description: toolDescription,huggingface_url: huggingfaceUrl,github_url: githubUrl,likes: likes,chatgpt_prompt: chatgptPrompt,research_description: researchDescription,research_url: researchUrl}
    const workflowStepId = await addOrUpdateWorkflowStep(data,workflowStep_id);

    const likeButton = document.createElement('button');
    likeButton.classList.add('like-btn');
    if (category === 'workflow_step') {
        likeButton.innerHTML = `${workFlowName}`;
    } else {
        likeButton.innerHTML = `${workFlowName} <span class="thumbs-up">👍 ${likes}</span>`;
    }
    likeButton.dataset.workflowStepId = workflowStepId;
    likeButton.dataset.workflowStepName = workFlowName;
    likeButton.dataset.workflowCategory = category;
    likeButton.dataset.toolDescription = toolDescription;
    likeButton.dataset.huggingfaceUrl = huggingfaceUrl;
    likeButton.dataset.githubUrl = githubUrl;
    likeButton.dataset.chatgptPrompt = chatgptPrompt;
    likeButton.dataset.researchDescription = researchDescription;
    likeButton.dataset.researchUrl = researchUrl;

    const hoverMenu = createHoverMenu(category,workFlowName, toolDescription,huggingfaceUrl,githubUrl,chatgptPrompt,researchDescription,researchUrl);
    likeButton.appendChild(hoverMenu);
    addLikeButtonEventListener(likeButton);
    if (oldButton) {
        sortLikeButtons(currentWorkFlowButton);
        replaceOldButton(oldButton,likeButton)
    } else {
    sortLikeButtons(currentWorkFlowButton);
    currentWorkFlowButton.appendChild(likeButton);
    }
    
    const workFlowInputContainer = document.getElementById('work-flow-input-container');
    workFlowInputContainer.style.display = 'none';
}

// Create the hover menu for the like button
function createHoverMenu(category,workFlowName, toolDescription,huggingfaceUrl,githubUrl,chatgptPrompt,researchDescription,researchUrl) {
    const hoverMenu = document.createElement('div');
    if (category !== 'workflow_step') {
        hoverMenu.innerHTML = `<div id="hover-list"><ul><li><p><b>Name:</b> ${workFlowName}</p>`;
        hoverMenu.classList.add('hover-menu');
    }

    let huggingfaceLink = '';
    let githubLink = '';
    let researchLink = '';
    if (toolDescription && toolDescription.trim() !=='' && category =='tools') {
        hoverMenu.innerHTML += `<li><p><b>Description:</b> ${toolDescription}</p></li>`
    } 
    if (huggingfaceUrl && huggingfaceUrl.trim() !== '' && category =='tools') {
        huggingfaceLink = `<a href="${huggingfaceUrl}" target="_blank">${huggingfaceUrl}</a>`;
        hoverMenu.innerHTML += `<li><p><b>Huggingface URL:</b> ${huggingfaceLink}</p></li>`
    
    } 
    if (githubUrl && githubUrl.trim() !== '' && category =='tools') {
        githubLink = `<a href="${githubUrl}" target="_blank">${githubUrl}</a>`;
        hoverMenu.innerHTML += `<li><p><b>Github URL:</b> ${githubLink}</p></li>`
    }

    if (chatgptPrompt && chatgptPrompt.trim() !== '' && category =='chatgpt_prompts') {
        hoverMenu.innerHTML += `<li><p><b>Prompt:</b> ${chatgptPrompt}</p></li>`
    }

    if (researchDescription && researchDescription.trim() !== '' && category =='influential_research') {
        researchLink = `<a href="${researchUrl}" target="_blank">${researchUrl}</a>`;
        hoverMenu.innerHTML += `<li><p><b>Description:</b> ${researchDescription}</p></li>`
    }

    if (researchUrl && researchUrl.trim() !== '' && category =='influential_research') {
        researchLink = `<a href="${researchUrl}" target="_blank">${researchUrl}</a>`;
        hoverMenu.innerHTML += `<li><p><b>Link:</b> ${researchLink}</p></li>`
    }

    hoverMenu.innerHTML += `</ul></div>`

    hoverMenu.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    return hoverMenu;
}

// Determine the category based on the cell index
function getCellCategory(cell) {
    const cellIndex = cell.cellIndex;
    switch (cellIndex) {
        case 1:
            return 'workflow_step';
        case 2:
            return 'tools';
        case 3:
            return 'chatgpt_prompts';
        case 4:
            return 'influential_research';
        default:
            return '';
    }
}

// Sort the like buttons within a cell by their like counts
function sortLikeButtons(cell) {

    if (cell.cellIndex=== 1) {
        return;
    }
    const likeButtons = Array.from(cell.querySelectorAll('.like-btn'));
    likeButtons.sort((a, b) => {
        const aLikes = parseInt(a.querySelector('.thumbs-up').textContent.split(' ')[1]);
        const bLikes = parseInt(b.querySelector('.thumbs-up').textContent.split(' ')[1]);
        return bLikes - aLikes;
    });

    likeButtons.forEach(button => {
        cell.appendChild(button);
    });
}

// Add or update a workflow step on the server
async function addOrUpdateWorkflowStep(data, workflowStepId = null) {
    let url = '/workflow_step';
    let method = 'POST';
    console.log(workflowStepId)

    if (workflowStepId) {
        console.log('got here')
        url += '/' + workflowStepId;
        method = 'PUT';
    }
    console.log(method)
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        console.error('There was an issue updating the workflow step');
    } else {
        const responseData = await response.json();
        return responseData.workflow_step_id;
    }
}

// Get the task ID from the row that contains the clicked element
function getTaskId(element) {
    const row = element.closest('tr');
    const taskCell = row.cells[0];
    return taskCell.dataset.taskId;
}

// Add a task to the server
async function addTaskToServer(task) {
    const response =     await fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task: task })
    });

    if (!response.ok) {
        console.error('There was an issue adding your task');
    } else {
        const responseData = await response.json();
        return responseData.task_id;
    }
}

async function updateTaskOnServer(taskId, taskName) {
    const response = await fetch(`/task/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task: taskName })
    });

    if (!response.ok) {
        console.error('There was an issue updating the task');
        console.error('Server response:', response); // Log the server response
    }
}


// Add event listeners to the like buttons
function addLikeButtonEventListener(likeButton) {
    likeButton.addEventListener('click', async function (event) {
        event.stopPropagation();
        const thumbsUpElement = this.querySelector('.thumbs-up');
        const currentLikes = parseInt(thumbsUpElement.textContent.split(' ')[1]);
        const workflowStepId = this.dataset.workflowStepId;

        // Retrieve the upvoted state from local storage
        const upvotedSteps = JSON.parse(localStorage.getItem('upvotedSteps') || '{}');
        const isUpvoted = upvotedSteps.hasOwnProperty(workflowStepId);

        // Check if the like button has been upvoted by the user before
        let newLikes = currentLikes;

        if (isUpvoted) {
            // If already upvoted, remove the upvote and decrement the count
            newLikes = currentLikes - 1;
            this.classList.remove('upvoted');
            delete upvotedSteps[workflowStepId];
        } else {
            // If not upvoted, add the upvote and increment the count
            newLikes = currentLikes + 1;
            this.classList.add('upvoted');
            upvotedSteps[workflowStepId] = true;
        }

        localStorage.setItem('upvotedSteps', JSON.stringify(upvotedSteps));
        thumbsUpElement.textContent = `👍 ${newLikes}`;
        const likes = newLikes
        const toolDescription = this.getAttribute('data-tool-description')
        const huggingfaceUrl = this.getAttribute('data-huggingface-url')
        const githubUrl = this.getAttribute('data-github-url')
        const chatgptPrompt = this.getAttribute('data-chatgpt-prompt')
        const researchDescription = this.getAttribute('data-research-description')
        const researchUrl = this.getAttribute('data-research-url')
    
        // Update the workflow step with the new likes count
        const taskId = getTaskId(this.parentElement.parentElement);
        const category = this.getAttribute('data-workflow-category');
        const workflowStepName = this.dataset.workflowStepName; // Get the workflow step name from the like button's parent element
        await addOrUpdateWorkflowStep({
            task_id: taskId,
            workflow_step_name: workflowStepName,
            category: category,
            likes: likes,
            tool_description: toolDescription,
            huggingface_url: huggingfaceUrl,
            github_url: githubUrl,
            chatgpt_prompt: chatgptPrompt,
            research_description: researchDescription,
            research_url: researchUrl,
            workflow_step_id: workflowStepId
        });

        // Call sortLikeButtons after updating the like count and saving the data
        const cell = this.parentElement;
        sortLikeButtons(cell);

    });
    
    addLikeButtonContextEventListeners(likeButton);

    // Add event listeners for hover menu
    const hoverMenu = likeButton.querySelector('.hover-menu');
    if (hoverMenu) {
        likeButton.addEventListener('mouseover', function (event) {
            event.stopPropagation();
            hoverMenu.style.display = 'block';
        });

        likeButton.addEventListener('mouseleave', function (event) {
            event.stopPropagation();
            hoverMenu.style.display = 'none';
        });
    }
}

function addLikeButtonContextEventListeners (likeButton) {
    likeButton.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        event.stopPropagation();

        const contextMenu = document.createElement('ul');
        contextMenu.classList.add('task-context-menu');
        contextMenu.innerHTML = `
            <li id="delete-workflow-step" data-workflow-step-id="${likeButton.dataset.workflowStepId}">Delete</li>
            <li id="edit-workflow-step" data-workflow-step-id="${likeButton.dataset.workflowStepId}">Edit</li>
        `;
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        document.body.appendChild(contextMenu);

        const deleteOption = contextMenu.querySelector('#delete-workflow-step');
        deleteOption.addEventListener('click', () => {
            deleteButton(likeButton);
            contextMenu.remove();
        });

        const editOption = contextMenu.querySelector('#edit-workflow-step');
        editOption.addEventListener('click', () => {
            editWorkflowStep(likeButton)
            contextMenu.remove();
        });

        let removeTimeoutId = setTimeout(() => {
            contextMenu.remove();
        }, 1000);

        contextMenu.addEventListener('mouseenter', () => {
            clearTimeout(removeTimeoutId);
        });

        contextMenu.addEventListener('mouseleave', () => {
            contextMenu.remove();
        });
    });
}

function editWorkflowStep (likeButton) {
    const workflowStepId = likeButton.dataset.workflowStepId;
    const workflowStepName = likeButton.dataset.workflowStepName;
    const toolDescription = likeButton.dataset.toolDescription;
    const huggingfaceUrl = likeButton.dataset.huggingfaceUrl;
    const githubUrl = likeButton.dataset.githubUrl;
    const chatgptPrompt = likeButton.dataset.chatgptPrompt;
    const researchDescription = likeButton.dataset.researchDescription;
    const researchUrl = likeButton.dataset.researchUrl;
    // const likes = likeButton.dataset.likes
    const thumbsUpElement = likeButton.querySelector('.thumbs-up');
    if (!likeButton.dataset.category === 'workflow_step') { 
        likes = parseInt(thumbsUpElement.textContent.split(' ')[1]);
    } else {likes = 0}

    // Pre-fill input fields with existing 
    
    document.getElementById('name-input').value = workflowStepName || ""; 
    document.getElementById("work-flow-input").value = workflowStepName || "";
    document.getElementById("tool-description-input").value = toolDescription || "";
    document.getElementById("huggingface-url-input").value = huggingfaceUrl || "";
    document.getElementById("github-url-input").value = githubUrl || "";
    document.getElementById("chatgpt-prompt-input").value = chatgptPrompt || "";
    document.getElementById("research-description-input").value = researchDescription || "";
    document.getElementById("research-url-input").value = researchUrl || "";

    // Add workflow_step_id to the submit button
    document.getElementById("submit-work-flow").dataset.workflowStepId = workflowStepId;
    document.getElementById("submit-work-flow").dataset.likes = likes;

    showWorkFlowInput(likeButton.closest('td'));
}


function clearInputFields() {
    document.getElementById("work-flow-input").value = "";
    document.getElementById('name-input').value = "";
    document.getElementById("tool-description-input").value = "";
    document.getElementById("huggingface-url-input").value = "";
    document.getElementById("github-url-input").value = "";
    document.getElementById("chatgpt-prompt-input").value = "";
    document.getElementById("research-description-input").value = "";
    document.getElementById("research-url-input").value = "";
    let submit = document.getElementById('submit-work-flow')
    submit.dataset.workflowStepId = "";  
}

function deleteButton(likeButton) {
    if (confirm('Are you sure you want to delete this button?')) {
        // Remove the button from the cell
        likeButton.parentElement.removeChild(likeButton);

        // Delete the workflow step from the server
        const workflowStepId = likeButton.dataset.workflowStepId;
        console.log(workflowStepId)
        deleteWorkflowStep(workflowStepId);
    }
}

async function deleteWorkflowStep(workflowStepId) {
    const response = await fetch(`/workflow_step/${workflowStepId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        console.error('There was an issue deleting the workflow step');
    }
}

function createLikebuttonsOnLoad() {
    const likeButtons = document.getElementsByClassName('like-btn');
    // Retrieve the upvoted state from local storage
    const upvotedSteps = JSON.parse(localStorage.getItem('upvotedSteps') || '{}');

    for (let i = 0; i < likeButtons.length; i++) {
        const workflowStepId = likeButtons[i].dataset.workflowStepId;
        if (upvotedSteps.hasOwnProperty(workflowStepId)) {
            likeButtons[i].classList.add('upvoted');
        }
    }

    for (let i = 0; i < likeButtons.length; i++) {
        // Get the workflow step name and Github URL from the data attributes
        const workFlowName = likeButtons[i].dataset.workflowStepName;
        const category = likeButtons[i].getAttribute('data-workflow-category')
        const toolDescription = likeButtons[i].getAttribute('data-tool-description');
        const huggingfaceUrl = likeButtons[i].getAttribute('data-huggingface-url');
        const githubUrl = likeButtons[i].getAttribute('data-github-url');
        const chatgptPrompt = likeButtons[i].getAttribute('data-chatgpt-prompt');
        const researchDescription = likeButtons[i].getAttribute('data-research-description');
        const researchUrl = likeButtons[i].getAttribute('data-research-url');

        // Create the hover menu for the like button
        const hoverMenu = createHoverMenu(category,workFlowName, toolDescription, huggingfaceUrl, githubUrl, chatgptPrompt, researchDescription, researchUrl);
        likeButtons[i].appendChild(hoverMenu);

        addLikeButtonEventListener(likeButtons[i]);
    }

    // Call sortLikeButtons for each cell
    const buttonContainers = document.getElementsByClassName('button-container');
    for (let i = 0; i < buttonContainers.length; i++) {
        sortLikeButtons(buttonContainers[i]);
    }
}

// Add event listeners to all workflow step cells
function addTaskCellEventListeners() {
    const taskCells = document.querySelectorAll('#task-table-body td[data-task-id]');

    taskCells.forEach(taskCell => {
        taskCell.addEventListener('contextmenu', function (event) {
        event.preventDefault(); // Prevent the browser context menu from showing
        showTaskContextMenu(event);
        });
    });
}

// Check if the workflow step name is a duplicate in the cell
function isWorkflowStepNameDuplicate(workFlowStepName, cell) {
    const likeButtons = cell.querySelectorAll('.like-btn');
    for (let i = 0; i < likeButtons.length; i++) {
        if (likeButtons[i].getAttribute('data-workflow-step-name') == workFlowStepName) {
            return true;
        }
    }
    return false;
}

// Check if the task name is a duplicate in the table
function isTaskDuplicate(taskName) {
    const tableBody = document.getElementById('task-table-body');
    const rows = tableBody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const taskCell = rows[i].cells[0];
        if (taskCell.textContent === taskName) {
            return true;
        }
    }
    return false;
}

// Add event listeners to all button containers
const buttonContainers = document.getElementsByClassName('button-container');
for (let i = 0; i < buttonContainers.length; i++) {
    buttonContainers[i].addEventListener('click', function (event) {
        showWorkFlowInput(this);
    });
}

function replaceOldButton(oldButton, updatedButton) {
    
    // Replace the old button with the updated button
    oldButton.parentElement.replaceChild(updatedButton, oldButton);
}