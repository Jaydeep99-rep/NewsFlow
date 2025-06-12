// Replace this with your actual API Gateway URL
const API_BASE_URL = 'https://ojftossn68.execute-api.ap-south-1.amazonaws.com/prod';

class NewsAggregator {
    constructor() {
        this.articles = [];
        this.sources = new Set();
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadNews();
        this.setupIntersectionObserver();
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refreshBtn');
        const sourceFilter = document.getElementById('sourceFilter');

        refreshBtn.addEventListener('click', () => {
            if (!this.isLoading) {
                this.loadNews();
            }
        });

        sourceFilter.addEventListener('change', (e) => {
            this.filterBySource(e.target.value);
        });

        // Add keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!this.isLoading) {
                    this.loadNews();
                }
            }
        });
    }

    setupIntersectionObserver() {
        // Add smooth animations for cards as they come into view
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '50px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
    }

    async loadNews() {
        this.isLoading = true;
        this.showLoading();
        this.hideError();
        this.updateRefreshButton(true);

        try {
            const response = await fetch(`${API_BASE_URL}/news`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.articles = data.articles || [];
            
            // Filter out articles with missing essential data
            this.articles = this.articles.filter(article => 
                article.title && 
                article.title.trim() !== '' && 
                article.url && 
                article.source
            );

            this.updateSourceFilter();
            this.renderNews(this.articles);
            
            // Show success indicator
            this.showSuccessIndicator();
            
        } catch (error) {
            console.error('Error loading news:', error);
            this.showError();
        } finally {
            this.isLoading = false;
            this.hideLoading();
            this.updateRefreshButton(false);
        }
    }

    updateRefreshButton(loading) {
        const refreshBtn = document.getElementById('refreshBtn');
        const refreshIcon = refreshBtn.querySelector('.refresh-icon');
        
        if (loading) {
            refreshBtn.disabled = true;
            refreshBtn.style.opacity = '0.7';
            refreshIcon.style.animation = 'spin 1s linear infinite';
        } else {
            refreshBtn.disabled = false;
            refreshBtn.style.opacity = '1';
            refreshIcon.style.animation = '';
        }
    }

    showSuccessIndicator() {
        const refreshBtn = document.getElementById('refreshBtn');
        const originalText = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Updated
        `;
        
        setTimeout(() => {
            refreshBtn.innerHTML = originalText;
        }, 2000);
    }

    updateSourceFilter() {
        this.sources.clear();
        this.articles.forEach(article => {
            if (article.source) {
                this.sources.add(article.source);
            }
        });

        const sourceFilter = document.getElementById('sourceFilter');
        const currentValue = sourceFilter.value;
        sourceFilter.innerHTML = '<option value="">All Sources</option>';
        
        Array.from(this.sources).sort().forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceFilter.appendChild(option);
        });

        // Restore previous selection if it still exists
        if (currentValue && this.sources.has(currentValue)) {
            sourceFilter.value = currentValue;
        }
    }

    filterBySource(source) {
        const filteredArticles = source 
            ? this.articles.filter(article => article.source === source)
            : this.articles;
        
        this.renderNews(filteredArticles);
    }

    renderNews(articles) {
        const container = document.getElementById('newsContainer');
        
        if (!articles || articles.length === 0) {
            container.innerHTML = `
                <div class="no-news">
                    <h3>No news articles found</h3>
                    <p>Try refreshing or selecting a different source. Our system fetches the latest news every 2 hours.</p>
                </div>
            `;
            return;
        }

        // Add fade out animation
        container.style.opacity = '0.7';
        
        setTimeout(() => {
            container.innerHTML = articles.map(article => this.createNewsCard(article)).join('');
            
            // Add intersection observer to new cards
            const newsCards = container.querySelectorAll('.news-card');
            newsCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                card.style.transitionDelay = `${index * 0.1}s`;
                
                if (this.observer) {
                    this.observer.observe(card);
                }
            });
            
            container.style.opacity = '1';
        }, 150);
    }

    createNewsCard(article) {
        const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const timeAgo = this.getTimeAgo(new Date(article.publishedAt));

        // Sanitize content to prevent XSS
        const title = this.sanitizeHTML(article.title);
        const description = article.description ? this.sanitizeHTML(article.description) : '';
        const author = article.author && article.author !== 'Unknown' ? this.sanitizeHTML(article.author) : '';
        const source = this.sanitizeHTML(article.source);

        return `
            <article class="news-card" onclick="this.openArticle('${article.url}')">
                ${article.urlToImage ? `
                    <img src="${article.urlToImage}" alt="${title}" class="news-image" 
                         onerror="this.style.display='none'"
                         loading="lazy">
                ` : ''}
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-source">${source}</span>
                        <span class="news-date" title="${publishedDate}">${timeAgo}</span>
                    </div>
                    <h2 class="news-title">${title}</h2>
                    ${description ? `<p class="news-description">${description}</p>` : ''}
                    ${author ? `<p class="news-author">${author}</p>` : ''}
                </div>
            </article>
        `;
    }

    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    showError() {
        document.getElementById('errorMessage').classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }
}

// Add method to news card prototype for opening articles
HTMLElement.prototype.openArticle = function(url) {
    // Add click animation
    this.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
        this.style.transform = '';
    }, 100);
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewsAggregator();
});

// Add service worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(registrationError => console.log('SW registration failed'));
    });
}