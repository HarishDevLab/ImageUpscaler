let upscaler = null;
let selectedEnhancement = null;
let originalImageData = null;
let enhancedImageData = null;
let isProcessing = false;
let librariesLoaded = false;


const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const enhancementSection = document.getElementById('enhancement-section');
const comparisonSection = document.getElementById('comparison-section');
const enhanceBtn = document.getElementById('enhance-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const originalImage = document.getElementById('original-image');
const enhancedImage = document.getElementById('enhanced-image');
const comparisonSlider = document.getElementById('comparison-slider');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const processingCanvas = document.getElementById('processing-canvas');


const loadingMessages = [
    "Cooking image... please wait",
    "Enhancing with AI...",
    "Processing pixels...",
    "Almost done..."
];


document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    initializeLibraries();
    setupEventListeners();
});


async function initializeLibraries() {
    try {
        console.log('Initializing libraries...');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        
        if (typeof tf !== 'undefined') {
            console.log('TensorFlow.js loaded');
        } else {
            console.log('TensorFlow.js not loaded');
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        if (typeof ort !== 'undefined') {
            console.log('ONNX Runtime loaded');
        } else {
            console.log('ONNX Runtime not loaded');
        }

        await new Promise(resolve => setTimeout(resolve, 500));


        await initializeUpscaler();
        
        librariesLoaded = true;
        console.log('All libraries initialized');

    } catch (error) {
        console.error('Library initialization error:', error);
        showError('Failed to initialize AI libraries. Please refresh the page.');
    }
}


async function initializeUpscaler() {
    try {
        if (typeof Upscaler !== 'undefined') {
            
            upscaler = new Upscaler({
                model: 'default'
            });
            console.log('UpscalerJS initialized with real model');
        } else {
            
            console.log('UpscalerJS not loaded, using mock');
            upscaler = {
                upscale: async (img, options) => {
                    
                    const scale = options.scale || 2;
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    return canvas;
                }
            };
            console.log('Mock upscaler initialized');
        }
    } catch (error) {
        console.error('UpscalerJS initialization error:', error);
        
        upscaler = {
            upscale: async (img, options) => {
                const scale = options.scale || 2;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                return canvas;
            }
        };
        console.log('Mock upscaler initialized (error fallback)');
    }
}


function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    
    uploadArea.addEventListener('click', function(e) {
        console.log('Upload area clicked');
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });
    
    
    uploadArea.addEventListener('click', function(e) {
        console.log('Upload area clicked (bubbled)');
        if (e.target !== fileInput) {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        }
    }, true);
    
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    fileInput.addEventListener('change', function(e) {
        console.log('File input changed');
        handleFileSelect(e);
    });

    
    document.querySelectorAll('.enhancement-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('Enhancement button clicked:', btn.dataset.type);
            selectEnhancement(btn.dataset.type);
        });
    });

    
    if (enhanceBtn) {
        enhanceBtn.addEventListener('click', function(e) {
            console.log('Enhance button clicked');
            enhanceImage();
        });
    }

    
    setupComparisonSlider();

    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadEnhancedImage);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetApplication);
    }
    
    console.log('Event listeners set up');
}


function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        console.log('File selected:', file.name);
        handleFile(file);
    }
}


function handleFile(file) {
    console.log('Processing file:', file.name, file.type, file.size);
    
    
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file.');
        return;
    }

    
    if (file.size > 10 * 1024 * 1024) {
        showError('Image file is too large. Please select a file smaller than 10MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('File loaded into memory');
        originalImageData = e.target.result;
        showImagePreview();
        showEnhancementOptions();
    };
    reader.onerror = function(e) {
        console.error('Error reading file:', e);
        showError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
}


function showImagePreview() {
    console.log('Showing image preview');
    uploadArea.classList.add('has-image');
    uploadArea.querySelector('.upload-text').textContent = 'Image loaded successfully';
    uploadArea.querySelector('.upload-subtext').textContent = 'Click to select a different image';
}


function showEnhancementOptions() {
    console.log('Showing enhancement options');
    enhancementSection.classList.add('show');
    enhancementSection.style.display = 'block';
    enhancementSection.scrollIntoView({ behavior: 'smooth' });
}


function selectEnhancement(type) {
    console.log('Enhancement selected:', type);
    selectedEnhancement = type;
    

    document.querySelectorAll('.enhancement-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    

    enhanceBtn.disabled = false;
    console.log('Enhance button enabled');
}


function showProcessingOverlay() {
    if (!loadingOverlay) return;
    loadingOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    updateLoadingText('Cooking image... please wait');
    let step = 0;

    if (window._processingOverlayTimers) {
        window._processingOverlayTimers.forEach(clearTimeout);
    }
    window._processingOverlayTimers = [
        setTimeout(() => {
            updateLoadingText('Generating image...');
            step = 1;
        }, 3000),
        setTimeout(() => {
            if (step === 1) updateLoadingText('Processing pixels...');
        }, 6000)
    ];
}

function hideProcessingOverlay() {
    if (!loadingOverlay) return;
    loadingOverlay.classList.remove('show');
    document.body.style.overflow = '';
    if (window._processingOverlayTimers) {
        window._processingOverlayTimers.forEach(clearTimeout);
        window._processingOverlayTimers = null;
    }
}

// Enhance image
async function enhanceImage() {
    console.log('Starting image enhancement...');
    
    if (!originalImageData || !selectedEnhancement || isProcessing) {
        console.log('Cannot enhance - missing data or processing');
        return;
    }

    isProcessing = true;
    showProcessingOverlay();

    try {
       
        const img = await loadImage(originalImageData);
        console.log('Original image loaded:', img.width, 'x', img.height);
        
        
        const scaledImg = await scaleImageIfNeeded(img);
        console.log('Image scaled if needed');
        
        
        originalImage.src = scaledImg.src;
        
        
        let enhancedCanvas;
        if (selectedEnhancement === 'deblur') {
            enhancedCanvas = await mockDeblurImage(scaledImg);
        } else {
            const scale = selectedEnhancement === '2x' ? 2 : 4;
            
            
            if (scale === 4) {
                updateLoadingText('First 2x enhancement...');
                const step1 = await upscaleImage(scaledImg, 2);
                const step1Img = await loadImage(step1.toDataURL());
                updateLoadingText('Second 2x enhancement...');
                enhancedCanvas = await upscaleImage(step1Img, 2);
            } else {
                enhancedCanvas = await upscaleImage(scaledImg, scale);
            }
        }

       
        enhancedImageData = enhancedCanvas.toDataURL('image/png');
        enhancedImage.src = enhancedImageData;

       
        showComparison();
        console.log('Image enhancement completed');

    } catch (error) {
        console.error('Enhancement error:', error);
        hideProcessingOverlay();
        
        
        const errorMsg = error.message.includes('model') 
            ? 'AI model failed to load. Please refresh and try again.'
            : 'Enhancement failed. Please try a smaller image.';
        
        showError(errorMsg);
    } finally {
        isProcessing = false;
        hideProcessingOverlay();
    }
}


function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });
}


async function scaleImageIfNeeded(img) {
    const maxSize = 1024; 
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let { width, height } = img;
    
  
    const scale = Math.min(maxSize / width, maxSize / height, 1);
    
    if (scale < 1) {
        width *= scale;
        height *= scale;
    }

    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(img, 0, 0, width, height);
    
    
    const scaledImg = new Image();
    scaledImg.src = canvas.toDataURL('image/png');
    
    return new Promise((resolve) => {
        scaledImg.onload = () => resolve(scaledImg);
    });
}


async function upscaleImage(img, scale) {
    updateLoadingText('Enhancing with AI...');
    try {
        
        const result = await upscaler.upscale(img, {
            scale,
            patchSize: 64,
            padding: 2,
            progress: (rate) => {
                updateLoadingText(`Enhancing: ${Math.floor(rate * 100)}% complete`);
            }
        });

        
        const canvas = document.createElement('canvas');
        canvas.width = result.width;
        canvas.height = result.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(result, 0, 0);
        return canvas;
    } catch (error) {
        console.error('Upscaling error:', error);
        
        return simpleUpscale(img, scale);
    }
}


function simpleUpscale(img, scale) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    return canvas;
}


async function mockDeblurImage(img) {
    updateLoadingText('Removing blur...');
    
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    
    ctx.drawImage(img, 0, 0);
    
   
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    
    const sharpenKernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ];
    
    const filteredData = applyKernel(data, canvas.width, canvas.height, sharpenKernel);
    
    
    const newImageData = ctx.createImageData(canvas.width, canvas.height);
    newImageData.data.set(filteredData);
    
   
    ctx.putImageData(newImageData, 0, 0);
    
    return canvas;
}


function applyKernel(data, width, height, kernel) {
    const output = new Uint8ClampedArray(data.length);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIdx = ((y + ky) * width + (x + kx)) * 4 + c;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        sum += data[pixelIdx] * kernel[kernelIdx];
                    }
                }
                output[idx + c] = Math.max(0, Math.min(255, sum));
            }
            output[idx + 3] = data[idx + 3]; 
        }
    }
    
    return output;
}


function showComparison() {
    console.log('Showing comparison section');
    comparisonSection.classList.add('show');
    comparisonSection.style.display = 'block';
    comparisonSection.scrollIntoView({ behavior: 'smooth' });
}


function setupComparisonSlider() {
    let isDragging = false;
    
    function updateSlider(clientX) {
        const rect = comparisonSlider.parentElement.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        
        comparisonSlider.style.left = `${percentage}%`;
        enhancedImage.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
    }
    
 
    comparisonSlider.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateSlider(e.clientX);
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    

    comparisonSlider.addEventListener('touchstart', (e) => {
        isDragging = true;
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            updateSlider(e.touches[0].clientX);
        }
    });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}


function downloadEnhancedImage() {
    if (!enhancedImageData) return;
    
    const link = document.createElement('a');
    link.download = `enhanced-image-${selectedEnhancement}-${Date.now()}.png`;
    link.href = enhancedImageData;
    link.click();
}


function resetApplication() {
    console.log('Resetting application');
    

    originalImageData = null;
    enhancedImageData = null;
    selectedEnhancement = null;
    

    uploadArea.classList.remove('has-image');
    uploadArea.querySelector('.upload-text').textContent = 'Drag and drop your image here';
    uploadArea.querySelector('.upload-subtext').textContent = 'or click to browse';
    
    enhancementSection.classList.remove('show');
    enhancementSection.style.display = 'none';
    comparisonSection.classList.remove('show');
    comparisonSection.style.display = 'none';
    
s
    document.querySelectorAll('.enhancement-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    enhanceBtn.disabled = true;
    

    fileInput.value = '';
    

    window.scrollTo({ top: 0, behavior: 'smooth' });
}


function showLoadingOverlay() {
    console.log('Showing loading overlay');
    loadingOverlay.style.display = 'flex';
    loadingOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideLoadingOverlay() {
    console.log('Hiding loading overlay');
    loadingOverlay.classList.remove('show');
    loadingOverlay.style.display = 'none';
    document.body.style.overflow = '';
}


function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}


Promise.race([
    new Promise(resolve => {
        if (window.tf) return resolve();
        const check = setInterval(() => { if (window.tf) { clearInterval(check); resolve(); } }, 50);
    }),
    new Promise(resolve => {
        if (window.ort) return resolve();
        const check = setInterval(() => { if (window.ort) { clearInterval(check); resolve(); } }, 50);
    }),
    new Promise(resolve => {
        if (window.Upscaler) return resolve();
        const check = setInterval(() => { if (window.Upscaler) { clearInterval(check); resolve(); } }, 50);
    })
]).then(hideLoadingOverlay);


function updateLoadingText(message) {
    if (loadingText) loadingText.textContent = message;
}


function showError(message) {
    alert(message);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


window.addEventListener('resize', debounce(() => {
   
    if (comparisonSection.classList.contains('show')) {
        comparisonSlider.style.left = '50%';
        enhancedImage.style.clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
    }
}, 250));


document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());