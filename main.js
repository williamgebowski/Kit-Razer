// Constants
const PRECO_REF_ITEM = 425.00; // 1700 / 4 = 425 por item
const PRECO_PROMOCIONAL = 299.90;
const CHECKOUT_URL = 'https://SEU-CHECKOUT.com/checkout';
const TIMEZONE = 'America/Sao_Paulo';

// Global state
let stockCount = 47;
let currentReviewIndex = 0;
let timerInterval;
let stockInterval;
let isOfferExpired = false;

// DOM Elements Cache
const domElements = {
    timerTop: document.getElementById('timer-top'),
    timerMain: document.getElementById('timer-main'),
    timerOffer: document.getElementById('timer-offer'),
    hoursMain: document.getElementById('hours'),
    minutesMain: document.getElementById('minutes'),
    secondsMain: document.getElementById('seconds'),
    hoursOffer: document.getElementById('hours-offer'),
    minutesOffer: document.getElementById('minutes-offer'),
    secondsOffer: document.getElementById('seconds-offer'),
    stockCount: document.getElementById('stock-count'),
    priceFrom: document.getElementById('price-from'),
    savingsAmount: document.getElementById('savings-amount'),
    stickyBottom: document.getElementById('sticky-bottom'),
    ctaButtons: document.querySelectorAll('.cta-primary, .cta-sticky, .cta-final'),
    reviewsCarousel: document.getElementById('reviews-carousel'),
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
    const spDate = new Date(now.toLocaleString("en-US", {timeZone: TIMEZONE}));
    const endOfDay = new Date(spDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Convert back to local timezone for comparison
    const offset = now.getTimezoneOffset() * 60000;
    const utcEndOfDay = endOfDay.getTime() + offset;
    const spOffset = -3 * 60 * 60000; // São Paulo is UTC-3
    
    return new Date(utcEndOfDay + spOffset);
}

function updatePriceCalculations() {
    const totalFrom = 1700.00; // Preço total original
    const savings = totalFrom - PRECO_PROMOCIONAL;
    const discountPercent = Math.round((savings / totalFrom) * 100);
    
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

    // Update main timer
    if (domElements.hoursMain) domElements.hoursMain.textContent = formatNumber(hours);
    if (domElements.minutesMain) domElements.minutesMain.textContent = formatNumber(minutes);
    if (domElements.secondsMain) domElements.secondsMain.textContent = formatNumber(seconds);

    // Update offer timer
    if (domElements.hoursOffer) domElements.hoursOffer.textContent = formatNumber(hours);
    if (domElements.minutesOffer) domElements.minutesOffer.textContent = formatNumber(minutes);
    if (domElements.secondsOffer) domElements.secondsOffer.textContent = formatNumber(seconds);

    // Update top timer
    if (domElements.timerTop) {
        domElements.timerTop.textContent = `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
    }
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
    if (domElements.hoursMain) domElements.hoursMain.textContent = '00';
    if (domElements.minutesMain) domElements.minutesMain.textContent = '00';
    if (domElements.secondsMain) domElements.secondsMain.textContent = '00';
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
    
    // Decrease stock randomly every 7-12 minutes
    const randomChance = Math.random();
    const shouldDecrease = randomChance < 0.15; // 15% chance each check (every minute)
    
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
    
    if (mouseMainImage && mouseThumbnails.length > 0) {
        initGallery(mouseMainImage, mouseThumbnails, 'mouse');
    }
    
    // Initialize Mousepad Gallery
    const mousepadMainImage = document.querySelector('.mousepad-main');
    const mousepadThumbnails = document.querySelectorAll('.mousepad-thumbnails img');
    
    if (mousepadMainImage && mousepadThumbnails.length > 0) {
        initGallery(mousepadMainImage, mousepadThumbnails, 'mousepad');
    }
}

function initGallery(mainImage, thumbnails, productType) {
    thumbnails.forEach((thumb, index) => {
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

// Reviews Carousel Functions
function initReviewsCarousel() {
    if (!domElements.reviewsCarousel) return;

    const reviews = domElements.reviewsCarousel.children;
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) return;

    // Create navigation dots
    const dotsContainer = document.querySelector('.carousel-dots');
    if (dotsContainer) {
        const numPages = Math.ceil(totalReviews / getVisibleReviews());
        for (let i = 0; i < numPages; i++) {
            const dot = document.createElement('div');
            dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => goToSlide(i));
            dot.setAttribute('aria-label', `Ir para página ${i + 1} de reviews`);
            dot.setAttribute('tabindex', '0');
            dot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToSlide(i);
                }
            });
            dotsContainer.appendChild(dot);
        }
    }

    // Add navigation event listeners
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => previousReview());
        prevBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                previousReview();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => nextReview());
        nextBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                nextReview();
            }
        });
    }

    // Keyboard navigation for carousel
    domElements.reviewsCarousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            previousReview();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextReview();
        }
    });

    // Auto-scroll
    setInterval(() => {
        if (!document.hidden && !isOfferExpired) {
            nextReview();
        }
    }, 8000);
}

function getVisibleReviews() {
    const width = window.innerWidth;
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
}

function updateCarouselPosition() {
    if (!domElements.reviewsCarousel) return;

    const visibleReviews = getVisibleReviews();
    const reviewWidth = 300; // 280px + 20px gap
    const offset = currentReviewIndex * reviewWidth;
    
    domElements.reviewsCarousel.style.transform = `translateX(-${offset}px)`;
    
    // Update dots
    const dots = document.querySelectorAll('.carousel-dot');
    const activeSlide = Math.floor(currentReviewIndex / visibleReviews);
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeSlide);
    });
}

function nextReview() {
    const totalReviews = domElements.reviewsCarousel?.children.length || 0;
    const visibleReviews = getVisibleReviews();
    const maxIndex = Math.max(0, totalReviews - visibleReviews);
    
    currentReviewIndex = currentReviewIndex >= maxIndex ? 0 : currentReviewIndex + visibleReviews;
    updateCarouselPosition();
}

function previousReview() {
    const totalReviews = domElements.reviewsCarousel?.children.length || 0;
    const visibleReviews = getVisibleReviews();
    const maxIndex = Math.max(0, totalReviews - visibleReviews);
    
    currentReviewIndex = currentReviewIndex <= 0 ? maxIndex : currentReviewIndex - visibleReviews;
    updateCarouselPosition();
}

function goToSlide(slideIndex) {
    const visibleReviews = getVisibleReviews();
    currentReviewIndex = slideIndex * visibleReviews;
    updateCarouselPosition();
}

// Coupon Functions
function applyCoupon() {
    const couponCode = domElements.couponInput?.value.trim().toUpperCase();
    const statusElement = domElements.couponStatus;
    
    if (!statusElement) return;
    
    if (couponCode === 'BFKIT') {
        statusElement.innerHTML = '<span class="coupon-valid">✓ Cupom BFKIT aplicado</span>';
        statusElement.setAttribute('aria-live', 'polite');
        
        // Track coupon application
        if (typeof gtag !== 'undefined') {
            gtag('event', 'coupon_applied', {
                coupon_code: couponCode,
                value: PRECO_PROMOCIONAL,
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
            value: PRECO_PROMOCIONAL,
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
            value: PRECO_PROMOCIONAL,
            items: [{
                item_id: 'KIT-RAZER-4X1-BF-2025',
                item_name: 'Kit Razer 4×1 — Black Friday',
                item_category: 'Gaming',
                price: PRECO_PROMOCIONAL,
                quantity: 1
            }]
        });
    }
    
    // Custom tracking event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'kit_razer_checkout_start', {
            event_category: 'ecommerce',
            event_label: 'Kit Razer 4x1 Black Friday',
            value: PRECO_PROMOCIONAL
        });
    }
}

// AB Testing
function initABTest() {
    const variant = getQueryParam('v');
    
    if (variant === 'b') {
        document.body.classList.add('variant-b');
        
        // Change hero image for variant B
        const heroImage = document.querySelector('.hero-image img');
        if (heroImage) {
            const originalSrc = heroImage.src;
            heroImage.src = originalSrc.replace('kit-hero.webp', 'kit-hero-b.webp');
            heroImage.alt = 'Kit Razer 4×1 completo - Variante B com destaque especial';
        }
        
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
        
        // Update price validity
        const endOfDay = getEndOfDayInTimezone();
        schema.offers.priceValidUntil = endOfDay.toISOString().split('T')[0];
        
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
    
    // Enhance timer accessibility
    if (domElements.timerMain) {
        domElements.timerMain.setAttribute('role', 'timer');
        domElements.timerMain.setAttribute('aria-live', 'polite');
        domElements.timerMain.setAttribute('aria-label', 'Tempo restante da oferta');
    }
    
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
        
        domElements.couponInput.addEventListener('input', () => {
            // Auto-apply known coupon
            if (domElements.couponInput.value.toUpperCase() === 'BFKIT') {
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
            updateCarouselPosition();
            handleStickyBottom();
        }, 100);
    });
    
    // Visibility change (for pausing animations when tab is not visible)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause timer updates to save resources
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        } else {
            // Resume timer updates
            if (!isOfferExpired) {
                updateTimer(); // Update immediately
                timerInterval = setInterval(updateTimer, 1000);
            }
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
    // Parallax effect on hero
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
    
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
    
    // Start timer
    updateTimer();
    if (!isOfferExpired) {
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    // Start stock updates (every minute)
    stockInterval = setInterval(updateStock, 60000);
    
    // Initialize reviews carousel
    initReviewsCarousel();
    
    // Initialize product galleries (headset, keyboard, mouse, mousepad)
    initProductGalleries();
    
    // Initialize visual effects
    initVisualEffects();
    
    // Initialize event listeners
    initEventListeners();
    
    // Enhance accessibility
    enhanceAccessibility();
    
    // Apply initial coupon if present
    if (domElements.couponInput?.value) {
        applyCoupon();
    }
    
    // Initialize lazy loading
    lazyLoadImages();
    
    // Update JSON-LD schema
    updateProductSchema();
    
    // Initial sticky bottom check
    handleStickyBottom();
    
    // Preload critical images
    const criticalImages = [
        './assets/kit-hero.webp',
        './assets/kit-hero-b.webp',
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
    
    // Fallback behavior for critical functions
    if (e.error && e.error.message.includes('timer')) {
        // Ensure CTA buttons remain functional
        domElements.ctaButtons.forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', () => {
                    window.location.href = preserveUTMs(CHECKOUT_URL);
                });
            }
        });
    }
    
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
        updatePriceCalculations
    };
}