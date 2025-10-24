/**
 * Arquivo principal da aplicação Markdown Viewer
 * Responsável por inicializar e coordenar todos os módulos
 */

class MarkdownViewer {
    constructor() {
        this.fileManager = null;
        this.markdownProcessor = null;
        this.uiManager = null;
        this.initialized = false;
        
        // Configurações da aplicação
        this.config = {
            name: 'Markdown Viewer',
            version: '1.0.0',
            author: 'Desenvolvido com JavaScript',
            debug: false
        };
        
        // Estado da aplicação
        this.state = {
            ready: false,
            error: null,
            currentFile: null
        };
    }
    
    /**
     * Inicializa a aplicação
     */
    async init() {
        try {
            console.log(`Inicializando ${this.config.name} v${this.config.version}`);
            
            // Verifica dependências
            this.checkDependencies();
            
            // Configura error handling global
            this.setupErrorHandling();
            
            // Inicializa módulos na ordem correta
            await this.initializeModules();
            
            // Configura eventos entre módulos
            this.setupModuleEvents();
            
            // Marca como inicializada
            this.initialized = true;
            this.state.ready = true;
            
            console.log('✅ Markdown Viewer inicializado com sucesso');
            
            // Dispara evento de aplicação pronta
            this.dispatchEvent('appReady', {
                config: this.config,
                state: this.state
            });
            
        } catch (error) {
            console.error('❌ Erro ao inicializar aplicação:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Verifica se todas as dependências estão disponíveis
     */
    checkDependencies() {
        const dependencies = [
            { name: 'marked', check: () => typeof marked !== 'undefined' },
            { name: 'FileManager', check: () => typeof FileManager !== 'undefined' },
            { name: 'MarkdownProcessor', check: () => typeof MarkdownProcessor !== 'undefined' },
            { name: 'UIManager', check: () => typeof UIManager !== 'undefined' }
        ];
        
        const missing = dependencies.filter(dep => !dep.check());
        
        if (missing.length > 0) {
            throw new Error(`Dependências não encontradas: ${missing.map(d => d.name).join(', ')}`);
        }
        
        console.log('✅ Todas as dependências verificadas');
    }
    
    /**
     * Configura tratamento global de erros
     */
    setupErrorHandling() {
        // Erros JavaScript não capturados
        window.addEventListener('error', (event) => {
            console.error('Erro não capturado:', event.error);
            this.handleError(event.error, 'JavaScript Error');
        });
        
        // Promises rejeitadas não capturadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejeitada não capturada:', event.reason);
            this.handleError(event.reason, 'Promise Rejection');
        });
        
        // Erros de recursos (imagens, scripts, etc.)
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                console.warn('Erro ao carregar recurso:', event.target.src || event.target.href);
            }
        }, true);
    }
    
    /**
     * Inicializa todos os módulos
     */
    async initializeModules() {
        try {
            // Inicializa UI Manager primeiro (gerencia interface)
            console.log('Inicializando UI Manager...');
            this.uiManager = new UIManager();
            window.uiManager = this.uiManager; // Expõe globalmente
            
            // Aguarda um frame para garantir que o DOM esteja pronto
            await this.nextFrame();
            
            // Inicializa File Manager
            console.log('Inicializando File Manager...');
            this.fileManager = new FileManager();
            window.fileManager = this.fileManager; // Expõe globalmente ← CRUCIAL!
            
            // NÃO aguarda mais o structureLoaded aqui, pois agora o usuário
            // precisa escolher o modo de carregamento primeiro
            // O evento será disparado depois que o usuário fizer a escolha
            
            // Inicializa Markdown Processor
            console.log('Inicializando Markdown Processor...');
            this.markdownProcessor = new MarkdownProcessor();
            window.markdownProcessor = this.markdownProcessor; // Expõe globalmente
            
            console.log('✅ Todos os módulos inicializados');
            console.log('✅ Módulos expostos globalmente:', {
                fileManager: !!window.fileManager,
                markdownProcessor: !!window.markdownProcessor,
                uiManager: !!window.uiManager
            });
            
        } catch (error) {
            throw new Error(`Erro ao inicializar módulos: ${error.message}`);
        }
    }
    
    /**
     * Configura eventos entre módulos
     */
    setupModuleEvents() {
        // Eventos de arquivo selecionado
        document.addEventListener('fileSelected', (event) => {
            this.state.currentFile = event.detail.file;
            this.logEvent('fileSelected', event.detail);
        });
        
        // Eventos de conteúdo carregado
        document.addEventListener('markdownLoaded', (event) => {
            this.logEvent('markdownLoaded', event.detail);
        });
        
        // Eventos de estrutura carregada - inicia indexação automática
        document.addEventListener('structureLoaded', (event) => {
            this.logEvent('structureLoaded', event.detail);

            // Inicia indexação automática de arquivos para busca de conteúdo
            if (this.fileManager && this.fileManager.contentSearcher) {
                console.log('🔄 Iniciando indexação automática de arquivos...');
                setTimeout(() => {
                    this.fileManager.contentSearcher.indexAllFiles();
                }, 1000); // Aguarda 1 segundo para não interferir no carregamento inicial
            }
        });

        // Eventos de tema alterado
        document.addEventListener('themeChanged', (event) => {
            this.logEvent('themeChanged', event.detail);
        });
        
        // Eventos de busca
        document.addEventListener('searchUpdated', (event) => {
            this.logEvent('searchUpdated', event.detail);
        });

        // Eventos de resultados de busca de conteúdo
        document.addEventListener('contentSearchResults', (event) => {
            this.logEvent('contentSearchResults', event.detail);
        });
    }
    
    /**
     * Lida com erros de inicialização
     */
    handleInitializationError(error) {
        this.state.error = error;
        this.state.ready = false;
        
        // Mostra erro na interface
        const contentDisplay = document.getElementById('content-display');
        if (contentDisplay) {
            contentDisplay.innerHTML = `
                <div class="error-state" style="padding: 2rem; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                    <h2 style="color: var(--text-primary); margin-bottom: 1rem;">Erro de Inicialização</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${error.message}</p>
                    <button onclick="location.reload()" 
                            style="padding: 0.75rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: var(--border-radius); cursor: pointer; font-size: 1rem;">
                        Recarregar Aplicação
                    </button>
                </div>
            `;
        }
        
        // Remove loading se existir
        const loading = document.querySelector('.loading-message');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    /**
     * Lida com erros gerais da aplicação
     */
    handleError(error, context = 'Application') {
        console.error(`[${context}]`, error);
        
        // Se a UI estiver disponível, mostra toast de erro
        if (this.uiManager && typeof this.uiManager.showToast === 'function') {
            this.uiManager.showToast(
                `Erro: ${error.message || 'Erro desconhecido'}`,
                'error',
                5000
            );
        }
        
        // Registra erro para analytics/logging
        this.logError(error, context);
    }
    
    /**
     * Registra eventos para debug/analytics
     */
    logEvent(eventName, data) {
        if (this.config.debug) {
            console.log(`📊 [Event] ${eventName}:`, data);
        }
        
        // Aqui você poderia enviar para analytics
        // analytics.track(eventName, data);
    }
    
    /**
     * Registra erros para debug/logging
     */
    logError(error, context) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        if (this.config.debug) {
            console.log('🚨 [Error]', errorData);
        }
        
        // Aqui você poderia enviar para serviço de logging
        // errorLogger.send(errorData);
    }
    
    /**
     * Obtém informações da aplicação
     */
    getInfo() {
        return {
            ...this.config,
            state: this.state,
            initialized: this.initialized,
            modules: {
                fileManager: !!this.fileManager,
                markdownProcessor: !!this.markdownProcessor,
                uiManager: !!this.uiManager
            },
            statistics: this.getStatistics()
        };
    }
    
    /**
     * Obtém estatísticas da aplicação
     */
    getStatistics() {
        const stats = {
            uptime: this.initialized ? Date.now() - this.initTime : 0,
            currentFile: this.state.currentFile?.name || null,
            theme: this.uiManager?.theme || 'unknown'
        };
        
        // Adiciona estatísticas dos módulos se disponíveis
        if (this.fileManager) {
            stats.fileStructure = Object.keys(this.fileManager.getFileStructure()).length;
        }
        
        if (this.markdownProcessor) {
            stats.cacheSize = this.markdownProcessor.getCacheStats?.()?.size || 0;
        }
        
        if (this.uiManager) {
            stats.ui = this.uiManager.getStats?.() || {};
        }
        
        return stats;
    }
    
    /**
     * Recarrega a aplicação
     */
    async reload() {
        console.log('🔄 Recarregando aplicação...');
        
        try {
            // Limpa caches
            if (this.markdownProcessor) {
                this.markdownProcessor.clearCache();
            }
            
            // Recarrega estrutura de arquivos
            if (this.fileManager) {
                await this.fileManager.refreshFileStructure();
            }
            
            // Reseta UI
            if (this.uiManager) {
                this.uiManager.reset();
            }
            
            console.log('✅ Aplicação recarregada');
            
        } catch (error) {
            console.error('❌ Erro ao recarregar aplicação:', error);
            this.handleError(error, 'Reload');
        }
    }
    
    /**
     * Destroi a aplicação
     */
    destroy() {
        console.log('🗑️ Destruindo aplicação...');
        
        // Remove event listeners
        // (em uma implementação real, você manteria referências dos listeners)
        
        // Limpa referências
        this.fileManager = null;
        this.markdownProcessor = null;
        this.uiManager = null;
        
        this.initialized = false;
        this.state.ready = false;
        
        console.log('✅ Aplicação destruída');
    }
    
    /**
     * Utilitários
     */
    
    /**
     * Aguarda próximo frame de animação
     */
    nextFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    /**
     * Aguarda um evento específico
     */
    waitForEvent(eventName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout aguardando evento: ${eventName}`));
            }, timeout);
            
            document.addEventListener(eventName, function handler(event) {
                clearTimeout(timer);
                document.removeEventListener(eventName, handler);
                resolve(event);
            });
        });
    }
    
    /**
     * Dispara evento customizado
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * Delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Salva referência da classe
const MarkdownViewerClass = MarkdownViewer;

// Cria instância global da aplicação
console.log('Criando instância do MarkdownViewer...');
const app = new MarkdownViewerClass();
console.log('Instância criada:', app);
console.log('Método init existe na instância:', typeof app.init);

// Torna a classe disponível globalmente 
window.MarkdownViewerClass = MarkdownViewerClass;

// Torna a instância disponível globalmente - SOBRESCREVENDO a classe
window.MarkdownViewer = app;
console.log('MarkdownViewer definido globalmente como:', window.MarkdownViewer);
console.log('Tipo de window.MarkdownViewer:', typeof window.MarkdownViewer);
console.log('window.MarkdownViewer.init:', typeof window.MarkdownViewer.init);

// Expõe métodos úteis no console para debug
if (typeof window !== 'undefined' && window.console) {
    window.mdv = {
        info: () => app.getInfo(),
        reload: () => app.reload(),
        stats: () => app.getStatistics(),
        modules: {
            get fileManager() { return app.fileManager; },
            get markdownProcessor() { return app.markdownProcessor; },
            get uiManager() { return app.uiManager; }
        }
    };
}