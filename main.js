// Constants
const PRECO_DE = 2199.90;
const PRECO_POR = 659.90;
const DESCONTO_PCT = 70;
const ECONOMIA = PRECO_DE - PRECO_POR; // R$ 1.540,00
const CHECKOUT_URL = 'https://SEU-CHECKOUT.com/checkout';


// Global state
let stockCount = 47;
let timerInterval;
let stockInterval;
let isOfferExpired = false;

// DOM Elements Cache
const domElements = {
    timerTop: document.getElementById('timer-top'),
    timerOffer: document.getElementById('timer-offer'),
    hoursOffer: document.getElementById('hours-offer'),
    minutesOffer: document.getElementById('minutes-offer'),
    secondsOffer: document.getElementById('seconds-offer'),
    stockCount: document.getElementById('stock-count'),
    priceFrom: document.getElementById('price-from'),
    savingsAmount: document.getElementById('savings-amount'),
    stickyBottom: document.getElementById('sticky-bottom'),
    ctaButtons: document.querySelectorAll('.cta-primary, .cta-sticky, .cta-final'),

    couponInput: document.getElementById('coupon'),
    couponStatus: document.getElementById('coupon-status'),
    applyCouponBtn: document.getElementById('apply-coupon'),
    productSchema: document.getElementById('product-schema')
};

// Utility Functions
function formatNumber(num) {
    return num.toString().padStart(2, '0');
}

function formatPrice(price) {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
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

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function preserveUTMs(url) {
    const currentParams = window.location.search;
    if (currentParams) {
        const separator = url.includes('?') ? '&' : '?';
        return url + separator + currentParams.substring(1);
    }
    return url;
}

function getEndOfDayInTimezone() {
    const now = new Date();
    
    // Create date in São Paulo timezone
    const spDate = new Date(now.toLocaleString("en-US", {timeZone: 'America/Sao_Paulo'}));
    const endOfDay = new Date(spDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Convert back to local timezone for comparison
    const offset = now.getTimezoneOffset() * 60000;
    const utcEndOfDay = endOfDay.getTime() + offset;
    const spOffset = -3 * 60 * 60000; // São Paulo is UTC-3
    
    return new Date(utcEndOfDay + spOffset);
}



function updatePriceCalculations() {
    const totalFrom = PRECO_DE; // Preço total original
    const savings = ECONOMIA; // Economia calculada
    const discountPercent = DESCONTO_PCT; // Fixo em 70%
    
    if (domElements.priceFrom) {
        domElements.priceFrom.textContent = formatPrice(totalFrom);
    }
    
    if (domElements.savingsAmount) {
        domElements.savingsAmount.textContent = formatPrice(savings);
    }
    
    // Atualizar elementos com porcentagem de desconto
    const discountElements = document.querySelectorAll('.discount-percent');
    discountElements.forEach(elem => {
        elem.textContent = `${discountPercent}%`;
    });
}

// Timer Functions
function updateTimer() {
    const now = new Date().getTime();
    const endTime = getEndOfDayInTimezone().getTime();
    const timeLeft = endTime - now;

    if (timeLeft <= 0) {
        handleOfferExpired();
        return;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Update top timer
    if (domElements.timerTop) {
        domElements.timerTop.textContent = `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
    }

    // Update offer timer
    if (domElements.hoursOffer) domElements.hoursOffer.textContent = formatNumber(hours);
    if (domElements.minutesOffer) domElements.minutesOffer.textContent = formatNumber(minutes);
    if (domElements.secondsOffer) domElements.secondsOffer.textContent = formatNumber(seconds);
}

function handleOfferExpired() {
    isOfferExpired = true;
    
    // Clear timer interval
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Update timer displays
    const expiredText = '00:00:00';
    if (domElements.timerTop) domElements.timerTop.textContent = expiredText;
    if (domElements.hoursOffer) domElements.hoursOffer.textContent = '00';
    if (domElements.minutesOffer) domElements.minutesOffer.textContent = '00';
    if (domElements.secondsOffer) domElements.secondsOffer.textContent = '00';

    // Disable CTA buttons
    domElements.ctaButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = 'Oferta encerrada — verifique disponibilidade';
        btn.setAttribute('aria-label', 'Oferta expirada - verifique disponibilidade');
    });

    // Update JSON-LD schema
    updateProductSchema();

    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'A oferta especial expirou. Verifique disponibilidade.';
    document.body.appendChild(announcement);
    
    setTimeout(() => document.body.removeChild(announcement), 5000);
}

// Stock Functions
function updateStock() {
    if (isOfferExpired) return;
    
    // Decrease stock randomly every 7-12 minutes (média de 10 min)
    const randomChance = Math.random();
    const shouldDecrease = randomChance < 0.1; // 10% chance each check (every minute) = ~10 min em média
    
    if (shouldDecrease && stockCount > 19) {
        const decrease = Math.floor(Math.random() * 2) + 1; // 1-2 units
        stockCount = Math.max(19, stockCount - decrease);
        
        if (domElements.stockCount) {
            domElements.stockCount.textContent = stockCount;
            
            // Add visual feedback for stock change
            domElements.stockCount.style.transform = 'scale(1.1)';
            domElements.stockCount.style.color = '#ff6b6b';
            setTimeout(() => {
                domElements.stockCount.style.transform = '';
                domElements.stockCount.style.color = '';
            }, 500);
        }
    }
}

// Product Gallery Functions
function initProductGalleries() {
    // Initialize Headset Gallery
    const headsetMainImage = document.querySelector('.headset-main');
    const headsetThumbnails = document.querySelectorAll('.headset-thumbnails img');
    
    if (headsetMainImage && headsetThumbnails.length > 0) {
        initGallery(headsetMainImage, headsetThumbnails, 'headset');
    }
    
    // Initialize Keyboard Gallery
    const keyboardMainImage = document.querySelector('.keyboard-main');
    const keyboardThumbnails = document.querySelectorAll('.keyboard-thumbnails img');
    
    if (keyboardMainImage && keyboardThumbnails.length > 0) {
        initGallery(keyboardMainImage, keyboardThumbnails, 'keyboard');
    }
    
    // Initialize Mouse Gallery
    const mouseMainImage = document.querySelector('.mouse-main');
    const mouseThumbnails = document.querySelectorAll('.mouse-thumbnails img');
    
    console.log('Mouse gallery elements:', { mouseMainImage, mouseThumbnails });
    
    if (mouseMainImage && mouseThumbnails.length > 0) {
        initGallery(mouseMainImage, mouseThumbnails, 'mouse');
        
        // Add error handling for mouse images
        mouseMainImage.addEventListener('error', (e) => {
            console.error('Error loading mouse main image:', e.target.src);
            e.target.style.display = 'none';
        });
        
        mouseThumbnails.forEach((thumb, index) => {
            thumb.addEventListener('error', (e) => {
                console.error(`Error loading mouse thumbnail ${index}:`, e.target.src);
                e.target.style.display = 'none';
            });
        });
    } else {
        console.warn('Mouse gallery elements not found:', { mouseMainImage, mouseThumbnails });
    }
    
    // Initialize Mousepad Gallery
    const mousepadMainImage = document.querySelector('.mousepad-main');
    const mousepadThumbnails = document.querySelectorAll('.mousepad-thumbnails img');
    
    if (mousepadMainImage && mousepadThumbnails.length > 0) {
        initGallery(mousepadMainImage, mousepadThumbnails, 'mousepad');
    }
}

function initGallery(mainImage, thumbnails, productType) {
    console.log(`Initializing gallery for ${productType}:`, { mainImage, thumbnails });
    
    // Ensure main image is visible
    if (mainImage) {
        mainImage.style.display = 'block';
        mainImage.style.visibility = 'visible';
        mainImage.style.opacity = '1';
        console.log(`${productType} main image styles:`, {
            display: mainImage.style.display,
            visibility: mainImage.style.visibility,
            opacity: mainImage.style.opacity,
            src: mainImage.src
        });
    }
    
    thumbnails.forEach((thumb, index) => {
        // Ensure thumbnails are visible
        thumb.style.display = 'block';
        thumb.style.visibility = 'visible';
        thumb.style.opacity = '1';
        
        thumb.addEventListener('click', () => {
            // Store original main image src
            const originalSrc = mainImage.src;
            const originalAlt = mainImage.alt;
            
            // Swap images
            mainImage.src = thumb.src;
            mainImage.alt = thumb.alt;
            
            // Update thumbnail to show previous main image
            thumb.src = originalSrc;
            thumb.alt = originalAlt;
            
            // Add active state animation
            mainImage.style.opacity = '0';
            setTimeout(() => {
                mainImage.style.opacity = '1';
            }, 150);
            
            // Add click effect to thumbnail
            thumb.style.transform = 'scale(0.9)';
            setTimeout(() => {
                thumb.style.transform = '';
            }, 150);
            
            // Track gallery interaction
            if (typeof gtag !== 'undefined') {
                gtag('event', 'gallery_interaction', {
                    product_type: productType,
                    image_index: index,
                    interaction_type: 'thumbnail_click'
                });
            }
        });
        
        // Add keyboard navigation
        thumb.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                thumb.click();
            }
        });
        
        // Make thumbnails focusable
        thumb.setAttribute('tabindex', '0');
        thumb.setAttribute('role', 'button');
        thumb.setAttribute('aria-label', `Ver imagem do ${productType}: ${thumb.alt}`);
    });
}

// Reviews Static Groups Functions
function initReviewsNavigation() {
    const navButtons = document.querySelectorAll('.review-nav-btn');
    
    if (navButtons.length === 0) {
        console.warn('Review navigation buttons not found');
        return;
    }

    console.log('Initializing static reviews navigation with 5 groups');

    // Add click listeners to navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const groupNumber = button.getAttribute('data-group');
            showReviewGroup(groupNumber);
            updateActiveButton(button);
        });

        // Keyboard support
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const groupNumber = button.getAttribute('data-group');
                showReviewGroup(groupNumber);
                updateActiveButton(button);
            }
        });
    });

    // Set initial state (group 1 active)
    showReviewGroup('1');
}

function showReviewGroup(groupNumber) {
    // Hide all groups
    const allGroups = document.querySelectorAll('.reviews-group');
    allGroups.forEach(group => {
        group.classList.remove('active');
    });

    // Show selected group
    const targetGroup = document.getElementById(`reviews-group-${groupNumber}`);
    if (targetGroup) {
        targetGroup.classList.add('active');
        console.log(`Showing review group ${groupNumber}`);
    } else {
        console.warn(`Review group ${groupNumber} not found`);
    }
}

function updateActiveButton(activeButton) {
    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('.review-nav-btn');
    allButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Add active class to clicked button
    activeButton.classList.add('active');
}



// Coupon Functions
function applyCoupon() {
    const couponCode = domElements.couponInput?.value.trim().toUpperCase();
    const statusElement = domElements.couponStatus;
    
    if (!statusElement) return;
    
    if (couponCode === 'BFKIT') {
        statusElement.innerHTML = '<span class="coupon-valid">✓ BFKIT aplicado</span>';
        statusElement.setAttribute('aria-live', 'polite');
        
        // Track coupon application
        if (typeof gtag !== 'undefined') {
            gtag('event', 'coupon_applied', {
                coupon_code: couponCode,
                value: PRECO_POR,
                currency: 'BRL'
            });
        }
        
        // Announce to screen readers
        announceToScreenReader('Cupom aplicado com sucesso');
    } else if (couponCode === '') {
        statusElement.innerHTML = '';
    } else {
        statusElement.innerHTML = '<span class="coupon-invalid">✗ Cupom inválido</span>';
        statusElement.setAttribute('aria-live', 'polite');
        
        // Announce invalid coupon
        announceToScreenReader('Cupom inválido');
    }
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => {
        if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
        }
    }, 3000);
}

// Sticky Bottom Bar Functions
function handleStickyBottom() {
    const heroSection = document.querySelector('.hero');
    const stickyBar = domElements.stickyBottom;
    
    if (!heroSection || !stickyBar) return;
    
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    const scrollPosition = window.scrollY + window.innerHeight;
    
    if (scrollPosition > heroBottom) {
        stickyBar.classList.add('show');
    } else {
        stickyBar.classList.remove('show');
    }
}

// Checkout Functions
function handleCheckout() {
    if (isOfferExpired) {
        announceToScreenReader('Oferta expirada. Verifique disponibilidade.');
        return;
    }
    
    const checkoutUrl = preserveUTMs(CHECKOUT_URL);
    
    // Track conversion events
    trackCheckoutEvent();
    
    // Small delay to ensure tracking fires
    setTimeout(() => {
        window.location.href = checkoutUrl;
    }, 100);
}

function trackCheckoutEvent() {
    // Facebook Pixel tracking
    if (typeof fbq !== 'undefined') {
        fbq('track', 'InitiateCheckout', {
            value: PRECO_POR,
            currency: 'BRL',
            content_name: 'Kit Razer 4×1 — Black Friday',
            content_category: 'Gaming',
            content_ids: ['KIT-RAZER-4X1-BF-2025'],
            content_type: 'product'
        });
    }
    
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'begin_checkout', {
            currency: 'BRL',
            value: PRECO_POR,
            items: [{
                item_id: 'KIT-RAZER-4X1-BF-2025',
                item_name: 'Kit Razer 4×1 — Black Friday',
                item_category: 'Gaming',
                price: PRECO_POR,
                quantity: 1
            }]
        });
    }
    
    // Custom tracking event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'kit_razer_checkout_start', {
            event_category: 'ecommerce',
            event_label: 'Kit Razer 4x1 Black Friday',
            value: PRECO_POR
        });
    }
}

// AB Testing
function initABTest() {
    const variant = getQueryParam('v');
    
    if (variant === 'b') {
        document.body.classList.add('variant-b');
        
        // Variant B styling only (no hero image change needed)
        
        // Track AB test variant
        if (typeof gtag !== 'undefined') {
            gtag('event', 'ab_test_variant', {
                variant_name: 'variant_b',
                test_name: 'cta_color_hero_image'
            });
        }
    }
}

// JSON-LD Schema Update
function updateProductSchema() {
    if (!domElements.productSchema) return;
    
    try {
        const schema = JSON.parse(domElements.productSchema.textContent);
        
        // Update price validity - hoje às 23:59:59 (America/Sao_Paulo)
        const endOfDay = getEndOfDayInTimezone();
        schema.offers.priceValidUntil = endOfDay.toISOString();
        
        // Update availability if offer expired
        if (isOfferExpired) {
            schema.offers.availability = 'https://schema.org/OutOfStock';
        }
        
        domElements.productSchema.textContent = JSON.stringify(schema, null, 2);
    } catch (error) {
        console.warn('Error updating product schema:', error);
    }
}

// Performance Optimizations
function lazyLoadImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Add loading state
                    img.classList.add('loading');
                    
                    // Handle load/error events
                    img.onload = () => {
                        img.classList.remove('loading');
                        imageObserver.unobserve(img);
                    };
                    
                    img.onerror = () => {
                        img.classList.remove('loading');
                        console.warn('Failed to load image:', img.src);
                        imageObserver.unobserve(img);
                    };
                    
                    // Don't re-set src if already set
                    if (!img.src || img.src.includes('placeholder')) {
                        img.src = img.dataset.src || img.src;
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        images.forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Accessibility Enhancements
function enhanceAccessibility() {
    // Add focus management for accordion elements
    const detailsElements = document.querySelectorAll('details');
    
    detailsElements.forEach(details => {
        const summary = details.querySelector('summary');
        if (summary) {
            summary.setAttribute('role', 'button');
            summary.setAttribute('aria-expanded', 'false');
            
            details.addEventListener('toggle', () => {
                summary.setAttribute('aria-expanded', details.open.toString());
            });
            
            // Keyboard navigation enhancement
            summary.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    details.open = !details.open;
                }
            });
        }
    });
    

    
    // Enhance stock counter accessibility
    if (domElements.stockCount) {
        const stockContainer = domElements.stockCount.parentElement;
        if (stockContainer) {
            stockContainer.setAttribute('aria-live', 'polite');
            stockContainer.setAttribute('aria-label', 'Quantidade em estoque');
        }
    }
    
    // Add skip link for keyboard navigation
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Pular para conteúdo principal';
    skipLink.className = 'sr-only';
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-40px';
    skipLink.style.left = '6px';
    skipLink.style.background = '#00ff88';
    skipLink.style.color = '#000';
    skipLink.style.padding = '8px';
    skipLink.style.textDecoration = 'none';
    skipLink.style.zIndex = '9999';
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// Event Listeners
function initEventListeners() {
    // CTA button clicks
    domElements.ctaButtons.forEach(btn => {
        btn.addEventListener('click', handleCheckout);
    });
    
    // Coupon application
    if (domElements.applyCouponBtn) {
        domElements.applyCouponBtn.addEventListener('click', applyCoupon);
    }
    
    if (domElements.couponInput) {
        domElements.couponInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyCoupon();
            }
        });
        

    }
    
    // Scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(handleStickyBottom, 10);
    });
    
    // Resize events
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(() => {
            handleStickyBottom();
        }, 100);
    });
    
    // Visibility change (for pausing animations when tab is not visible)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause timer updates to save resources
            // if (timerInterval) { // This line is removed as per the edit hint
            //     clearInterval(timerInterval);
            // }
        } else {
            // Resume timer updates
            // if (!isOfferExpired) { // This line is removed as per the edit hint
            //     updateTimer(); // Update immediately
            //     timerInterval = setInterval(updateTimer, 1000);
            // }
        }
    });
    
    // Handle page unload for analytics
    window.addEventListener('beforeunload', () => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view_duration', {
                event_category: 'engagement',
                value: Math.round((Date.now() - performance.timing.navigationStart) / 1000)
            });
        }
    });
}

// Visual Effects
function initVisualEffects() {
    // Parallax effect removed to prevent hero disappearing during scroll
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.benefit-card, .item-card, .review-card, .spec-item, .faq-item');
    animatedElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
    
    // Mouse follow effect for CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-primary, .cta-sticky');
    ctaButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            btn.style.setProperty('--mouse-x', `${x}px`);
            btn.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// Initialization
function init() {
    // Initialize price calculations
    updatePriceCalculations();
    
    // Initialize AB test
    initABTest();
    
    // Start stock updates (every minute)
    stockInterval = setInterval(updateStock, 60000);
    
    // Initialize reviews carousel with slight delay to ensure DOM is ready
    setTimeout(() => {
        initReviewsNavigation();
    }, 100);
    
    // Add resize listener for general overflow fixes
    window.addEventListener('resize', debounce(() => {
        // Fix any potential overflow issues
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
    }, 250));
    
    // Initialize product galleries (headset, keyboard, mouse, mousepad)
    initProductGalleries();
    
    // Verify image loading
    setTimeout(verifyImageLoading, 1000);
    
    // Initialize FAQ animations
    initFAQAnimations();
    
    // Initialize visual effects
    initVisualEffects();
    
    // Fix overflow issues on load
    setTimeout(() => {
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        
        // Ensure all containers are properly contained
        const containers = document.querySelectorAll('.container, .items-grid, .reviews-carousel');
        containers.forEach(container => {
            container.style.maxWidth = '100%';
            container.style.overflow = 'hidden';
        });
        
        // Ensure all gallery images load properly
        const galleryImages = document.querySelectorAll('.headset-main, .keyboard-main, .mouse-main, .mousepad-main, .thumbnail');
        galleryImages.forEach(img => {
            img.style.background = 'transparent';
            img.style.display = 'block';
            
            // Force reload if image fails to load
            img.addEventListener('error', () => {
                console.log(`Reloading image: ${img.src}`);
                setTimeout(() => {
                    const src = img.src;
                    img.src = '';
                    img.src = src;
                }, 100);
            });
        });
        
        // Ensure urgency section is always visible
        const urgencyInfo = document.querySelector('.urgency-info');
        const stockInfo = document.querySelector('.stock-info');
        
        if (urgencyInfo) {
            urgencyInfo.style.display = 'flex';
            urgencyInfo.style.visibility = 'visible';
            urgencyInfo.style.opacity = '1';
            urgencyInfo.style.position = 'relative';
            urgencyInfo.style.zIndex = '10';
        }
        
        if (stockInfo) {
            stockInfo.style.display = 'block';
            stockInfo.style.visibility = 'visible';
            stockInfo.style.opacity = '1';
        }
        
        // Fix responsive alignment issues
        adjustResponsiveAlignment();
    }, 500);
    
    // Function to adjust responsive alignment
    function adjustResponsiveAlignment() {
        const containers = document.querySelectorAll('.container');
        const heroContent = document.querySelector('.hero-content');
        const itemsGrid = document.querySelector('.items-grid');
        
        containers.forEach(container => {
            container.style.boxSizing = 'border-box';
            container.style.margin = '0 auto';
        });
        
        if (heroContent) {
            heroContent.style.textAlign = 'center';
            heroContent.style.width = '100%';
            heroContent.style.maxWidth = '900px';
            heroContent.style.margin = '0 auto';
        }
        
        if (itemsGrid) {
            itemsGrid.style.margin = '0 auto';
            itemsGrid.style.boxSizing = 'border-box';
        }
        
        // Adjust alignment based on screen size
        const updateAlignment = () => {
            const width = window.innerWidth;
            const topbarContent = document.querySelector('.topbar-content');
            
            if (topbarContent && width <= 640) {
                topbarContent.style.flexDirection = 'column';
                topbarContent.style.textAlign = 'center';
            } else if (topbarContent) {
                topbarContent.style.flexDirection = 'row';
                topbarContent.style.textAlign = 'left';
            }
        };
        
        updateAlignment();
        window.addEventListener('resize', debounce(updateAlignment, 250));
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Enhance accessibility
    enhanceAccessibility();
    
    // Initialize lazy loading
    lazyLoadImages();
    
    // Update JSON-LD schema
    updateProductSchema();
    
    // Initial sticky bottom check
    handleStickyBottom();
    
    // Start timer
    updateTimer();
    if (!isOfferExpired) {
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    // Update timer display
    const timerTop = document.getElementById('timer-top');
    if (timerTop) {
        timerTop.textContent = '--:--:--';
    }
    
    // Não aplicar cupom automaticamente - só após ação do usuário
    // setTimeout(() => {
    //     if (domElements.couponInput) {
    //         domElements.couponInput.value = 'BFKIT';
    //         applyCoupon();
    //     }
    // }, 100);
    
    // Preload critical images
    const criticalImages = [
        './assets/headset-01.png',
        './assets/keyboard-01.png'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
    
    // Track page load
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: 'Kit Razer 4x1 Black Friday',
            page_location: window.location.href
        });
    }
    
    // Add main content ID for skip link
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.id = 'main-content';
        heroSection.setAttribute('tabindex', '-1');
    }
}

// Error handling
window.addEventListener('error', (e) => {
    console.warn('JavaScript error:', e.error);
    

    
    // Track errors for debugging
    if (typeof gtag !== 'undefined') {
        gtag('event', 'javascript_error', {
            event_category: 'error',
            event_label: e.error?.message || 'Unknown error',
            non_interaction: true
        });
    }
});

// Performance monitoring
if ('performance' in window && 'measure' in window.performance) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loadTime = Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_load_time', {
                    event_category: 'performance',
                    value: loadTime,
                    non_interaction: true
                });
            }
        }, 0);
    });
}

// Image loading verification
function verifyImageLoading() {
    const mouseImages = document.querySelectorAll('.mouse-gallery img');
    console.log('Verifying mouse images:', mouseImages);
    
    mouseImages.forEach((img, index) => {
        if (img.complete) {
            console.log(`Mouse image ${index} loaded successfully:`, img.src);
        } else {
            console.log(`Mouse image ${index} still loading:`, img.src);
            img.addEventListener('load', () => {
                console.log(`Mouse image ${index} finished loading:`, img.src);
            });
            img.addEventListener('error', (e) => {
                console.error(`Mouse image ${index} failed to load:`, img.src, e);
            });
        }
    });
}

// FAQ Animations
function initFAQAnimations() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    faqItems.forEach(item => {
        observer.observe(item);
    });
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatNumber,
        formatPrice,
        preserveUTMs,
        getEndOfDayInTimezone,
        updateTimer,
        updateStock,
        applyCoupon,
        handleCheckout,
        trackCheckoutEvent,
        updatePriceCalculations,
        initFAQAnimations
    };
}