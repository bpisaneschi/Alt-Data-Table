document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('task-form').addEventListener('submit', addTask);
    document.getElementById('submit-work-flow').addEventListener('click', submitWorkFlowName);

    createLikebuttonsOnLoad();
    addWorkflowStepCellEventListeners();
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
    const workFlowStepCell = row.insertCell();
    const toolsCell = row.insertCell();
    const chatGPTPromptsCell = row.insertCell();
    const influentialResearchCell = row.insertCell();

    taskCell.textContent = task;
    taskCell.dataset.taskId = taskId;

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
    }
};

// Show the input fields to add or edit workflow steps
function showWorkFlowInput(cell) {
    currentWorkFlowButton = cell;
    const workFlowInputContainer = document.getElementById('work-flow-input-container');
    const workFlowInput = document.getElementById('work-flow-input');
    // const githubUrlInput = document.getElementById('github-url-input');
    // const chatgptPrompt = document.getElementById('chatgpt-prompt-input')
    // const researchDescription = document.getElementById('research-description-input')
    // const researchUrl = document.getElementById('research-url-input')
    workFlowInput.value = '';

    showToolInput(cell.cellIndex === 2);
    showChatgptPromptInput(cell.cellIndex ===3);
    showResearchInput(cell.cellIndex ===4)

    let buttonContainer = currentWorkFlowButton.querySelector('.workflow-step-container');
    if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.classList.add('workflow-step-container');
        currentWorkFlowButton.appendChild(buttonContainer);
    }

    workFlowInputContainer.style.display = 'block';
    workFlowInput.focus();
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
    const toolDescriptionInput = document.getElementById('tool-description-input')
    const huggingfaceUrlInput = document.getElementById('huggingface-url-input')
    const githubUrlInput = document.getElementById('github-url-input');
    const chatgptPromptInput = document.getElementById('chatgpt-prompt-input')
    const researchDescriptionInput = document.getElementById('research-description-input')
    const researchUrlInput = document.getElementById('research-url-input')
    const toolDescription = toolDescriptionInput.value.trim()
    const huggingfaceUrl = huggingfaceUrlInput.value.trim()
    const workFlowName = workFlowInput.value.trim();
    const githubUrl = githubUrlInput.value.trim();
    const chatgptPrompt = chatgptPromptInput.value.trim();
    const researchDescription = researchDescriptionInput.value.trim();
    const researchUrl = researchUrlInput.value.trim(); 

    if (isWorkflowStepNameDuplicate(workFlowName, currentWorkFlowButton)) {
        alert('This workflow step name already exists in this cell');
        return;
    }

    if (workFlowName.length === 0) {
        alert('Please enter a name');
        return;
    }

    const taskId = getTaskId(currentWorkFlowButton);
    const category = getCellCategory(currentWorkFlowButton);
    const workflowStepId = await addOrUpdateWorkflowStep({         
        task_id: taskId,
        workflow_step_name: workFlowName,
        category: category,
        tool_description: toolDescription,
        huggingface_url: huggingfaceUrl,
        github_url: githubUrl,
        likes: 0,
        chatgpt_prompt: chatgptPrompt,
        research_description: researchDescription,
        research_url: researchUrl
    });

    const buttonContainer = currentWorkFlowButton.querySelector('.workflow-step-container');
    const existingButton = Array.from(buttonContainer.getElementsByClassName('like-btn')).find(button => button.textContent.includes(workFlowName));

    if (existingButton) {
        const thumbsUpElement = existingButton.querySelector('.thumbs-up');
        const likes = parseInt(thumbsUpElement.textContent.split(' ')[1]) + 1;
        thumbsUpElement.textContent = `👍 ${likes}`;
        await addOrUpdateWorkflowStep(taskId, workFlowName, category, likes, githubUrl,chatgptPrompt,researchDescription,researchUrl,existingButton.dataset.workflowStepId);
    } else {
        const likeButton = document.createElement('button');
        likeButton.classList.add('like-btn');
        likeButton.innerHTML = `${workFlowName} <span class="thumbs-up">👍 0</span>`;
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
        sortLikeButtons(currentWorkFlowButton);

        currentWorkFlowButton.appendChild(likeButton);
    }
    

    const workFlowInputContainer = document.getElementById('work-flow-input-container');
    workFlowInputContainer.style.display = 'none';
}

// Create the hover menu for the like button
function createHoverMenu(category,workFlowName, toolDescription,huggingfaceUrl,githubUrl,chatgptPrompt,researchDescription,researchUrl) {
    const hoverMenu = document.createElement('div');
    hoverMenu.classList.add('hover-menu');
    hoverMenu.innerHTML = `<div id="hover-list"><ul><li><p><b>Name:</b> ${workFlowName}</p>`

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
async function addOrUpdateWorkflowStep(data) {
    const response = await fetch('/workflow_step', {
        method: 'POST',
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

// Add event listeners to the like buttons
function addLikeButtonEventListener(likeButton) {
    likeButton.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        event.stopPropagation();
        deleteButton(this);
        });
    likeButton.addEventListener('click', async function (event) {
        event.stopPropagation();
        const thumbsUpElement = this.querySelector('.thumbs-up');
        const likes = parseInt(thumbsUpElement.textContent.split(' ')[1]) + 1;
        const toolDescription = this.getAttribute('data-tool-description')
        const huggingfaceUrl = this.getAttribute('data-huggingface-url')
        const githubUrl = this.getAttribute('data-github-url')
        const chatgptPrompt = this.getAttribute('data-chatgpt-prompt')
        const researchDescription = this.getAttribute('data-research-description')
        const researchUrl = this.getAttribute('data-research-url')
        thumbsUpElement.textContent = `👍 ${likes}`;
    
        // Update the workflow step with the new likes count
        const taskId = getTaskId(this.parentElement.parentElement);
        const category = this.getAttribute('data-workflow-category');
        const workflowStepId = this.dataset.workflowStepId;
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
function addWorkflowStepCellEventListeners() {
    const workFlowStepCells = document.getElementsByClassName('work-flow-step-cell');
    for (let i = 0; i < workFlowStepCells.length; i++) {
        workFlowStepCells[i].addEventListener('click', function () {
            showWorkFlowInput(this);
        });
    }
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


