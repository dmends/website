/**
 * Módulo responsável pelo gerenciamento da interface do usuário
 * e interações do Markdown Viewer
 */

class UIManager {
    constructor() {
        this.theme = 'light';
        this.sidebarOpen = false;
        this.isMobile = false;
        
        // Estados da interface
        this.states = {
            loading: false,
            error: false,
            fileSelected: false
        };
        
        this.init();
    }
    
    /**
     * Inicializa o gerenciador de UI
     */
    init() {
        this.detectMobile();
        this.loadTheme();
        this.setupEventListeners();
        this.initializeKeyboardShortcuts();
        this.updateViewport();
        
        // Configura observer para mudanças de tema do sistema
        this.setupThemeObserver();
    }
    
    /**
     * Detecta se está em dispositivo móvel
     */
    detectMobile() {
        this.isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile', this.isMobile);
        
        // Observa mudanças no tamanho da tela
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            document.body.classList.toggle('mobile', this.isMobile);
            
            // Se mudou de mobile para desktop ou vice-versa
            if (wasMobile !== this.isMobile) {
                this.handleViewportChange();
            }
        });
    }
    
    /**
     * Lida com mudanças no viewport
     */
    handleViewportChange() {
        if (!this.isMobile && this.sidebarOpen) {
            // Em desktop, garante que o sidebar esteja visível
            this.showSidebar();
        } else if (this.isMobile) {
            // Em mobile, fecha o sidebar por padrão
            this.hideSidebar();
        }
    }
    
    /**
     * Carrega o tema salvo
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('markdown-viewer-theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        
        this.theme = savedTheme || systemTheme;
        this.applyTheme(this.theme);
    }
    
    /**
     * Aplica um tema
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        
        // Atualiza ícone do botão de tema
        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) {
            const icon = themeButton.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Salva a preferência
        localStorage.setItem('markdown-viewer-theme', theme);
        
        // Dispara evento de mudança de tema
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));
    }
    
    /**
     * Alterna entre temas
     */
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
    
    /**
     * Configura observer para tema do sistema
     */
    setupThemeObserver() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // Só aplica automaticamente se não há preferência salva
            if (!localStorage.getItem('markdown-viewer-theme')) {
                const systemTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(systemTheme);
            }
        });
    }
    
    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        // Toggle do menu
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Toggle do tema
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Botão de exportar PDF
        const exportPdfButton = document.getElementById('export-pdf');
        if (exportPdfButton) {
            exportPdfButton.addEventListener('click', () => {
                this.exportToPDF();
            });
        }

        // Botão de trocar pasta
        const changeFolderBtn = document.getElementById('change-folder');
        if (changeFolderBtn) {
            changeFolderBtn.addEventListener('click', () => {
                if (window.fileManager && typeof window.fileManager.loadDynamicStructure === 'function') {
                    window.fileManager.loadDynamicStructure();
                }
            });
        }
        
        // Overlay do sidebar (mobile)
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this.hideSidebar();
            });
        }
        
        // Eventos customizados
        document.addEventListener('fileSelected', (event) => {
            this.handleFileSelected(event.detail);
        });
        
        document.addEventListener('structureLoaded', (event) => {
            this.handleStructureLoaded(event.detail);
        });
        
        document.addEventListener('markdownLoaded', (event) => {
            this.handleMarkdownLoaded(event.detail);
        });
        
        // Eventos do teclado
        document.addEventListener('keydown', (event) => {
            this.handleKeydown(event);
        });
        
        // Eventos de scroll para lazy loading ou efeitos
        const contentArea = document.querySelector('.content-display');
        if (contentArea) {
            contentArea.addEventListener('scroll', this.throttle(() => {
                this.handleContentScroll();
            }, 100));
        }
    }
    
    /**
     * Configura atalhos de teclado
     */
    initializeKeyboardShortcuts() {
        this.shortcuts = new Map([
            ['ctrl+/', () => this.focusSearch()],
            ['ctrl+b', () => this.toggleSidebar()],
            ['ctrl+shift+d', () => this.toggleTheme()],
            ['escape', () => this.handleEscape()]
        ]);
    }
    
    /**
     * Lida com eventos de teclado
     */
    handleKeydown(event) {
        const key = this.getKeyCombo(event);
        const action = this.shortcuts.get(key);
        
        if (action) {
            event.preventDefault();
            action();
        }
    }
    
    /**
     * Obtém combinação de teclas
     */
    getKeyCombo(event) {
        const parts = [];
        
        if (event.ctrlKey) parts.push('ctrl');
        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');
        
        parts.push(event.key.toLowerCase());
        
        return parts.join('+');
    }
    
    /**
     * Lida com a tecla Escape
     */
    handleEscape() {
        if (this.sidebarOpen && this.isMobile) {
            this.hideSidebar();
        }
        
        // Remove foco de elementos
        document.activeElement?.blur?.();
    }
    
    /**
     * Foca no campo de busca
     */
    focusSearch() {
        const searchInput = document.getElementById('file-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    /**
     * Alterna visibilidade do sidebar
     */
    toggleSidebar() {
        if (this.sidebarOpen) {
            this.hideSidebar();
        } else {
            this.showSidebar();
        }
    }
    
    /**
     * Mostra o sidebar
     */
    showSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (sidebar) {
            sidebar.classList.add('open');
            sidebar.classList.remove('collapsed');
            this.sidebarOpen = true;
            
            // Atualiza ícone do botão
            if (menuToggle) {
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
            }
            
            if (this.isMobile && overlay) {
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden'; // Previne scroll do body
            }
        }
    }
    
    /**
     * Esconde o sidebar
     */
    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (sidebar) {
            sidebar.classList.remove('open');
            this.sidebarOpen = false;
            
            // Em desktop, adiciona classe collapsed
            if (!this.isMobile) {
                sidebar.classList.add('collapsed');
            }
            
            // Atualiza ícone do botão
            if (menuToggle && !this.isMobile) {
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-chevron-right';
                }
            }
            
            if (overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = ''; // Restaura scroll do body
            }
        }
    }
    
    /**
     * Lida com seleção de arquivo
     */
    handleFileSelected(detail) {
        this.states.fileSelected = true;
        
        // Em mobile, fecha o sidebar após seleção
        if (this.isMobile) {
            this.hideSidebar();
        }
        
        // Atualiza título da página
        document.title = `${detail.file.name} - Markdown Viewer`;
        
        this.showToast(`Carregando ${detail.file.name}...`, 'info', 2000);
    }
    
    /**
     * Lida com estrutura carregada
     */
    handleStructureLoaded(detail) {
        const fileCount = this.countFiles(detail.structure);
        this.showToast(`${fileCount} arquivos carregados`, 'success', 3000);
    }
    
    /**
     * Conta arquivos na estrutura
     */
    countFiles(structure) {
        let count = 0;
        
        for (const item of Object.values(structure)) {
            if (item.type === 'file') {
                count++;
            } else if (item.type === 'folder' && item.children) {
                count += this.countFiles(item.children);
            }
        }
        
        return count;
    }
    
    /**
     * Lida com markdown carregado
     */
    handleMarkdownLoaded(detail) {
        this.states.loading = false;
        this.states.error = false;
        
        // Mostra informações do arquivo no toast
        this.showToast(`${detail.file.name} carregado com sucesso`, 'success', 2000);
        
        // Analisa e mostra estatísticas do conteúdo
        this.analyzeContent(detail.html);
    }
    
    /**
     * Analisa conteúdo e mostra estatísticas
     */
    analyzeContent(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const stats = {
            headings: doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
            paragraphs: doc.querySelectorAll('p').length,
            links: doc.querySelectorAll('a').length,
            images: doc.querySelectorAll('img').length,
            codeBlocks: doc.querySelectorAll('pre code').length
        };
        
        // Aqui você poderia exibir as estatísticas em algum lugar da UI
        console.log('Estatísticas do conteúdo:', stats);
    }
    
    /**
     * Lida com scroll do conteúdo
     */
    handleContentScroll() {
        const contentArea = document.querySelector('.content-display');
        if (!contentArea) return;
        
        const scrollPercentage = (contentArea.scrollTop / (contentArea.scrollHeight - contentArea.clientHeight)) * 100;
        
        // Aqui você poderia implementar uma barra de progresso de leitura
        // ou outros efeitos baseados no scroll
        
        // Exemplo: mostrar botão "voltar ao topo" quando scroll > 20%
        this.toggleScrollToTop(scrollPercentage > 20);
    }
    
    /**
     * Mostra/esconde botão de voltar ao topo
     */
    toggleScrollToTop(show) {
        let button = document.getElementById('scroll-to-top');
        
        if (show && !button) {
            button = this.createScrollToTopButton();
            document.body.appendChild(button);
        } else if (!show && button) {
            button.remove();
        }
    }
    
    /**
     * Cria botão de voltar ao topo
     */
    createScrollToTopButton() {
        const button = document.createElement('button');
        button.id = 'scroll-to-top';
        button.className = 'scroll-to-top';
        button.innerHTML = '<i class="fas fa-arrow-up"></i>';
        button.title = 'Voltar ao topo';
        button.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            transition: all var(--transition-normal);
        `;
        
        button.addEventListener('click', () => {
            const contentArea = document.querySelector('.content-display');
            if (contentArea) {
                contentArea.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        
        return button;
    }
    
    /**
     * Mostra toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = this.createToast(message, type);
        document.body.appendChild(toast);
        
        // Anima entrada
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Remove após duração
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    /**
     * Cria elemento de toast
     */
    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        
        toast.innerHTML = `
            <i class="fas fa-${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1rem;
            box-shadow: var(--shadow-lg);
            z-index: 1100;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 250px;
            transform: translateX(100%);
            transition: transform var(--transition-normal);
        `;
        
        // Estilização por tipo
        const colors = {
            info: 'var(--accent-color)',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        
        toast.style.borderLeftColor = colors[type] || colors.info;
        toast.style.borderLeftWidth = '4px';
        
        return toast;
    }
    
    /**
     * Adiciona classe show ao toast
     */
    showToastElement(toast) {
        toast.style.transform = 'translateX(0)';
    }
    
    /**
     * Atualiza viewport
     */
    updateViewport() {
        // Atualiza variáveis CSS baseadas no viewport
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        
        window.addEventListener('resize', () => {
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        });
    }
    
    /**
     * Função throttle para performance
     */
    throttle(func, wait) {
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
    
    /**
     * Função debounce para performance
     */
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    /**
     * Obtém estatísticas da UI
     */
    getStats() {
        return {
            theme: this.theme,
            sidebarOpen: this.sidebarOpen,
            isMobile: this.isMobile,
            states: { ...this.states },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
    
    /**
     * Exporta o conteúdo renderizado para PDF
     */
    async exportToPDF() {
        const contentDisplay = document.getElementById('content-display');
        const exportButton = document.getElementById('export-pdf');
        
        if (!contentDisplay) {
            this.showToast('Nenhum conteúdo para exportar', 'warning', 3000);
            return;
        }
        
        // Verifica se há conteúdo markdown (não é a tela de boas-vindas)
        const markdownContent = contentDisplay.querySelector('.markdown-content');
        if (!markdownContent) {
            this.showToast('Selecione um documento para exportar', 'warning', 3000);
            return;
        }
        
        // Desabilita o botão durante a exportação
        if (exportButton) {
            exportButton.disabled = true;
            exportButton.classList.add('exporting');
            const icon = exportButton.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-spinner';
            }
        }
        
        try {
            this.showToast('Gerando PDF...', 'info', 2000);
            
            // Obtém o nome do arquivo atual do breadcrumb
            const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
            const fileName = breadcrumbItems.length > 0 
                ? breadcrumbItems[breadcrumbItems.length - 1].textContent.trim()
                : 'documento';
            
            // Remove a extensão .md se existir
            const pdfFileName = fileName.replace(/\.md$/, '') + '.pdf';
            
            // Clona o conteúdo para processamento
            const contentClone = markdownContent.cloneNode(true);

            // Ajusta automaticamente o tamanho dos diagramas Mermaid (SVG)
            // Define largura máxima de 180mm para caber na página A4 (margem de segurança)
            const mermaidSvgs = contentClone.querySelectorAll('.mermaid svg');
                for (const svg of mermaidSvgs) {
                    // Container do SVG
                    const container = svg.parentElement;
                    if (container) {
                        container.style.overflow = 'visible';
                        container.style.width = '100%';
                        container.style.display = 'flex';
                        container.style.justifyContent = 'center';
                        container.style.alignItems = 'center';
                    }
                    svg.setAttribute('width', '90mm');
                    svg.style.width = '90mm';
                    svg.style.maxWidth = '90mm';
                    svg.removeAttribute('height');
                    svg.style.height = 'auto';
                    svg.style.display = 'block';
                    svg.style.margin = '0 auto';
            }

            // Ajusta estilos para o PDF
            this.preparePDFContent(contentClone);
            
            // Configurações do html2pdf
            const opt = {
                margin: [15, 15, 15, 15],
                filename: pdfFileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    logging: false
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: { 
                    mode: ['avoid-all', 'css', 'legacy'],
                    before: '.page-break-before',
                    after: '.page-break-after',
                    avoid: ['pre', 'code', 'img', 'table', 'blockquote']
                }
            };
            
            // Gera o PDF
            await html2pdf().set(opt).from(contentClone).save();
            
            this.showToast('PDF exportado com sucesso!', 'success', 3000);
            
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            this.showToast('Erro ao exportar PDF. Tente novamente.', 'error', 4000);
        } finally {
            // Restaura o botão
            if (exportButton) {
                exportButton.disabled = false;
                exportButton.classList.remove('exporting');
                const icon = exportButton.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-file-pdf';
                }
            }
        }
    }
    
    /**
     * Prepara o conteúdo HTML para exportação em PDF
     */
    preparePDFContent(content) {
        // Define estilos inline para garantir consistência no PDF
        const styles = `
            <style>
                * {
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    line-height: 1.6;
                    color: #1e293b;
                    font-size: 14px;
                }
                h1, h2, h3, h4, h5, h6 {
                    font-weight: 700;
                    line-height: 1.3;
                    margin-top: 1.5em;
                    margin-bottom: 0.75em;
                    color: #0f172a;
                    page-break-after: avoid;
                }
                h1 {
                    font-size: 28px;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 0.3em;
                }
                h2 {
                    font-size: 24px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 0.2em;
                }
                h3 { font-size: 20px; }
                h4 { font-size: 18px; }
                h5 { font-size: 16px; }
                h6 { font-size: 14px; color: #64748b; }
                p {
                    margin-bottom: 1em;
                    orphans: 3;
                    widows: 3;
                }
                a {
                    color: #2563eb;
                    text-decoration: none;
                    border-bottom: 1px solid #93c5fd;
                }
                ul, ol {
                    margin: 1em 0;
                    padding-left: 2em;
                }
                li {
                    margin-bottom: 0.5em;
                }
                blockquote {
                    border-left: 4px solid #2563eb;
                    padding: 0.75em 1em;
                    margin: 1em 0;
                    background-color: #f8fafc;
                    border-radius: 0 4px 4px 0;
                    color: #64748b;
                    font-style: italic;
                    page-break-inside: avoid;
                }
                code {
                    background-color: #f1f5f9;
                    padding: 0.125em 0.375em;
                    border-radius: 3px;
                    font-family: 'Monaco', 'Consolas', monospace;
                    font-size: 0.9em;
                    color: #1e293b;
                }
                pre {
                    background-color: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 1em;
                    margin: 1em 0;
                    overflow-x: auto;
                    font-family: 'Monaco', 'Consolas', monospace;
                    font-size: 0.85em;
                    line-height: 1.5;
                    page-break-inside: avoid;
                }
                pre code {
                    background: none;
                    padding: 0;
                    border-radius: 0;
                    font-size: inherit;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1em 0;
                    border: 1px solid #e2e8f0;
                    page-break-inside: avoid;
                }
                th, td {
                    padding: 0.5em 0.75em;
                    text-align: left;
                    border: 1px solid #e2e8f0;
                }
                th {
                    background-color: #f8fafc;
                    font-weight: 600;
                    border-bottom: 2px solid #e2e8f0;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    margin: 1em 0;
                    page-break-inside: avoid;
                }
                hr {
                    border: none;
                    height: 1px;
                    background-color: #e2e8f0;
                    margin: 1.5em 0;
                }
                .copy-button {
                    display: none !important;
                }
                .mermaid-zoom-button {
                    display: none !important;
                }
            </style>
        `;
        
        // Adiciona os estilos ao início do conteúdo
        content.innerHTML = styles + content.innerHTML;
        
        // Remove elementos que não devem aparecer no PDF
        const elementsToRemove = content.querySelectorAll('.copy-button, .mermaid-zoom-button');
        elementsToRemove.forEach(el => el.remove());
        
        return content;
    }
    
    /**
     * Reseta estados da UI
     */
    reset() {
        this.states = {
            loading: false,
            error: false,
            fileSelected: false
        };
        
        document.title = 'Markdown Viewer';
        
        // Remove toasts ativos
        document.querySelectorAll('.toast').forEach(toast => toast.remove());
        
        // Remove botão scroll to top
        const scrollButton = document.getElementById('scroll-to-top');
        if (scrollButton) scrollButton.remove();
    }
}

// Adiciona estilos para toasts
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast.show {
        transform: translateX(0) !important;
    }
    
    .scroll-to-top:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-xl);
    }
    
    @media (max-width: 768px) {
        .toast {
            top: 1rem !important;
            right: 1rem !important;
            left: 1rem !important;
            min-width: auto !important;
        }
        
        .scroll-to-top {
            bottom: 1rem !important;
            right: 1rem !important;
        }
    }
`;
document.head.appendChild(toastStyles);

// Torna a classe disponível globalmente
window.UIManager = UIManager;