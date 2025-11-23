let allPrompts = [];
let selectedPrompts = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchPrompts();
});

async function fetchPrompts() {
    const query = document.getElementById('searchInput').value;
    const response = await fetch(`/api/prompts?q=${encodeURIComponent(query)}`);
    allPrompts = await response.json();
    renderPrompts();
}

function renderPrompts() {
    const list = document.getElementById('promptsList');
    list.innerHTML = '';

    allPrompts.forEach(prompt => {
        const isSelected = selectedPrompts.some(p => p.id === prompt.id);
        const card = document.createElement('div');
        card.id = `card-${prompt.id}`;
        card.className = `bg-gray-800 rounded-lg border ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700'} p-4 shadow hover:shadow-md transition cursor-pointer relative group`;
        card.onclick = (e) => toggleSelection(prompt, e);

        const imageHtml = prompt.image_filename
            ? `<img src="/static/uploads/${prompt.image_filename}" class="w-full h-32 object-cover rounded mb-3" alt="${prompt.name}">`
            : `<div class="w-full h-32 bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-500 text-xs">No Preview</div>`;

        card.innerHTML = `
            ${imageHtml}
            <div class="flex justify-between items-start">
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-900/30 px-2 py-1 rounded">${prompt.type}</span>
                    <h3 class="text-lg font-bold text-white mt-2">${prompt.name}</h3>
                </div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition" onclick="event.stopPropagation()">
                    <button onclick="editPrompt(${prompt.id})" class="text-gray-400 hover:text-white p-1" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    </button>
                    <button onclick="deletePrompt(${prompt.id})" class="text-red-400 hover:text-red-300 p-1" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
            </div>
            <p class="text-gray-400 text-sm mt-2 line-clamp-2">${prompt.content}</p>
        `;
        list.appendChild(card);
    });
}

function toggleSelection(prompt, event) {
    if (event.target.closest('button')) return;

    const index = selectedPrompts.findIndex(p => p.id === prompt.id);
    const card = document.getElementById(`card-${prompt.id}`);

    if (index === -1) {
        selectedPrompts.push(prompt);
        if (card) {
            card.classList.remove('border-gray-700');
            card.classList.add('border-blue-500', 'ring-1', 'ring-blue-500');
        }
    } else {
        selectedPrompts.splice(index, 1);
        if (card) {
            card.classList.add('border-gray-700');
            card.classList.remove('border-blue-500', 'ring-1', 'ring-blue-500');
        }
    }
    updateAssembly();
}

function updateAssembly() {
    const container = document.getElementById('selectedPrompts');
    const finalTextArea = document.getElementById('finalPrompt');

    if (selectedPrompts.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm italic" id="emptySelectionMsg">Select prompts to assemble...</p>';
        finalTextArea.value = '';
        return;
    }

    container.innerHTML = '';

    selectedPrompts.forEach((prompt, index) => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center bg-gray-700 px-3 py-2 rounded text-sm';
        item.innerHTML = `
            <span class="truncate text-white">${prompt.name}</span>
            <button onclick="removeSelection(${index})" class="text-gray-400 hover:text-white ml-2">&times;</button>
        `;
        container.appendChild(item);
    });

    finalTextArea.value = selectedPrompts.map(p => p.content).join(', ');
}

function removeSelection(index) {
    const prompt = selectedPrompts[index];
    selectedPrompts.splice(index, 1);

    const card = document.getElementById(`card-${prompt.id}`);
    if (card) {
        card.classList.add('border-gray-700');
        card.classList.remove('border-blue-500', 'ring-1', 'ring-blue-500');
    }

    updateAssembly();
}

function copyToClipboard() {
    const text = document.getElementById('finalPrompt');
    text.select();
    document.execCommand('copy');

    const btn = document.querySelector('button[onclick="copyToClipboard()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Copied!';
    setTimeout(() => btn.innerHTML = originalText, 2000);
}

function openModal(isEdit = false) {
    const modal = document.getElementById('promptModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('promptForm');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Always reset form to clear previous state (especially file inputs)
    form.reset();

    // Reset image UI
    document.getElementById('currentImageContainer').classList.add('hidden');
    document.getElementById('currentImageContainer').classList.remove('flex');
    document.getElementById('deleteImage').value = 'false';

    if (!isEdit) {
        title.innerText = 'Add Prompt';
        document.getElementById('promptId').value = '';
    }
}

function closeModal() {
    const modal = document.getElementById('promptModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const id = document.getElementById('promptId').value;

    const url = id ? `/api/prompts/${id}` : '/api/prompts';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            body: formData
        });

        if (res.ok) {
            closeModal();
            fetchPrompts();
        } else {
            alert('Error saving prompt');
        }
    } catch (err) {
        console.error(err);
        alert('Error saving prompt');
    }
}

async function editPrompt(id) {
    const prompt = allPrompts.find(p => p.id === id);
    if (!prompt) return;

    openModal(true);
    document.getElementById('modalTitle').innerText = 'Edit Prompt';
    document.getElementById('promptId').value = prompt.id;
    document.getElementById('name').value = prompt.name;
    document.getElementById('type').value = prompt.type;
    document.getElementById('content').value = prompt.content;

    const imgContainer = document.getElementById('currentImageContainer');
    const imgName = document.getElementById('currentImageName');
    const delInput = document.getElementById('deleteImage');

    if (prompt.image_filename) {
        imgContainer.classList.remove('hidden');
        imgContainer.classList.add('flex');
        imgName.innerText = prompt.image_filename;
        delInput.value = 'false';
    } else {
        imgContainer.classList.add('hidden');
        imgContainer.classList.remove('flex');
        delInput.value = 'false';
    }
}

function markImageForDeletion() {
    document.getElementById('currentImageContainer').classList.add('hidden');
    document.getElementById('currentImageContainer').classList.remove('flex');
    document.getElementById('deleteImage').value = 'true';
    document.getElementById('image').value = ''; // Clear any new file selection
}

async function deletePrompt(id) {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    await fetch(`/api/prompts/${id}`, { method: 'DELETE' });

    const selIndex = selectedPrompts.findIndex(p => p.id === id);
    if (selIndex !== -1) {
        selectedPrompts.splice(selIndex, 1);
        updateAssembly();
    }

    fetchPrompts();
}
