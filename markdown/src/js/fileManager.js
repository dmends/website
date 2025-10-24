/**
 * Módulo responsável pelo gerenciamento da estrutura de arquivos
 * e navegação no sistema de arquivos
 */

class FileManager {
    constructor() {
        this.currentPath = '';
        this.fileStructure = {};
        this.filteredFiles = {};
        this.searchTerm = '';
        
        // Cache para otimização
        this.cache = new Map();
        
        // Carregador dinâmico de arquivos
        this.dynamicLoader = null;
        this.useDynamicLoader = false;
        
        // Busca de conteúdo
        this.contentSearcher = null;
        this.searchMode = 'filename'; // 'filename', 'content', 'both'
        this.contentSearchResults = [];

        // Eventos customizados
        this.events = {
            fileSelected: 'fileSelected',
            structureLoaded: 'structureLoaded',
            searchUpdated: 'searchUpdated',
            contentSearchResults: 'contentSearchResults'
        };
        
        this.init();
    }
    
    /**
     * Inicializa o gerenciador de arquivos
     */
    init() {
        console.log('🗂️ FileManager: Inicializando...');
        
        // Inicializa o carregador dinâmico se disponível
        if (typeof DynamicFileLoader !== 'undefined') {
            this.dynamicLoader = new DynamicFileLoader();
            console.log('✅ FileManager: DynamicFileLoader disponível');
        } else {
            console.log('⚠️ FileManager: DynamicFileLoader não disponível, usando modo estático');
        }
        
        // Inicializa o buscador de conteúdo se disponível
        if (typeof ContentSearcher !== 'undefined') {
            this.contentSearcher = new ContentSearcher();
            console.log('✅ FileManager: ContentSearcher disponível');
        } else {
            console.log('⚠️ FileManager: ContentSearcher não disponível');
        }

        this.loadFileStructure();
        this.setupEventListeners();
    }
    
    /**
     * Carrega a estrutura de arquivos
     * Tenta usar carregamento dinâmico ou fallback para structure.json
     */
    async loadFileStructure() {
        try {
            console.log('📂 FileManager: Carregando estrutura de arquivos...');
            
            // Remove mensagem de loading padrão
            const loadingMessage = document.querySelector('.loading-message');
            if (loadingMessage) {
                loadingMessage.remove();
            }
            
            // SEMPRE mostra opções se o navegador suporta File System Access API
            // Mesmo se existir structure.json, dá a opção ao usuário
            if (this.dynamicLoader && this.dynamicLoader.isSupported()) {
                console.log('✅ FileManager: Navegador suporta File System Access API');
                
                // Verifica se structure.json existe
                const hasStructureJson = await this.checkStructureJsonExists();
                
                // Mostra opções com informação se existe JSON
                this.showLoadingOptions(hasStructureJson);
            } else {
                console.log('⚠️ FileManager: Navegador não suporta File System Access API, usando structure.json');
                // Fallback para structure.json
                await this.loadStaticStructure();
            }
            
        } catch (error) {
            console.error('❌ FileManager: Erro ao carregar estrutura de arquivos:', error);
            this.showError('Erro ao carregar a estrutura de arquivos');
        }
    }
    
    /**
     * Verifica se structure.json existe
     */
    async checkStructureJsonExists() {
        try {
            const response = await fetch('./documentos/structure.json', { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Mostra opções de carregamento (dinâmico ou estático)
     */
    showLoadingOptions(hasStructureJson = false) {
        const fileTreeContainer = document.getElementById('file-tree');
        if (!fileTreeContainer) return;
        
        // Dispara evento indicando que interface está pronta para escolha
        this.dispatchEvent('loadingOptionsShown', { 
            supportsDynamic: true,
            hasStructureJson: hasStructureJson
        });
        
        const jsonInfo = hasStructureJson 
            ? '<small style="color: var(--success-color); display: block; margin-top: 0.5rem;"><i class="fas fa-check-circle"></i> structure.json detectado</small>'
            : '<small style="color: var(--text-muted); display: block; margin-top: 0.5rem;"><i class="fas fa-info-circle"></i> Nenhum structure.json encontrado</small>';
        
        fileTreeContainer.innerHTML = `
            <div style="padding: 2rem 1rem; text-align: center;">
                <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem; display: block;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Escolha como carregar os arquivos</h3>
                ${jsonInfo}
                
                <button id="load-dynamic" style="
                    width: 100%;
                    margin: 1.5rem 0 0.75rem 0;
                    padding: 1rem;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                    <i class="fas fa-folder"></i>
                    <span>Selecionar Pasta Local</span>
                </button>
                
                <button id="load-static" style="
                    width: 100%;
                    padding: 1rem;
                    background: var(--surface-color);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                " onmouseover="this.style.background='var(--hover-color)'" onmouseout="this.style.background='var(--surface-color)'">
                    <i class="fas fa-file-code"></i>
                    <span>Usar structure.json</span>
                </button>
                
                <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 1rem;">
                    <strong>Pasta Local:</strong> Carrega arquivos diretamente do seu computador<br>
                    <strong>structure.json:</strong> Usa estrutura pré-configurada
                </p>
            </div>
        `;
        
        // Adiciona event listeners
        document.getElementById('load-dynamic')?.addEventListener('click', () => {
            this.loadDynamicStructure();
        });
        
        document.getElementById('load-static')?.addEventListener('click', () => {
            this.loadStaticStructure();
        });
    }
    
    /**
     * Carrega estrutura de forma dinâmica
     */
    async loadDynamicStructure() {
        try {
            const fileTreeContainer = document.getElementById('file-tree');
            if (fileTreeContainer) {
                fileTreeContainer.innerHTML = `
                    <div style="padding: 2rem 1rem; text-align: center;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1rem; display: block;"></i>
                        <p style="color: var(--text-secondary);">Aguardando seleção da pasta...</p>
                    </div>
                `;
            }
            
            const success = await this.dynamicLoader.initialize();
            
            if (success) {
                this.useDynamicLoader = true;
                this.fileStructure = this.dynamicLoader.getFileStructure();
                this.filteredFiles = { ...this.fileStructure };
                this.renderFileTree();
                this.dispatchEvent(this.events.structureLoaded, { 
                    structure: this.fileStructure,
                    dynamic: true 
                });
                
                console.log('✅ Estrutura carregada dinamicamente');
            } else {
                // Usuário cancelou, mostra opções novamente
                this.showLoadingOptions();
            }
            
        } catch (error) {
            console.error('Erro ao carregar estrutura dinâmica:', error);
            
            // Mostra erro e fallback
            if (confirm(`Erro ao carregar pasta: ${error.message}\n\nDeseja usar structure.json como fallback?`)) {
                await this.loadStaticStructure();
            } else {
                this.showLoadingOptions();
            }
        }
    }
    
    /**
     * Carrega estrutura de forma estática (structure.json)
     */
    async loadStaticStructure() {
        try {
            const structure = await this.loadConfigFile();
            
            if (structure) {
                this.useDynamicLoader = false;
                this.fileStructure = structure;
                this.filteredFiles = { ...this.fileStructure };
                this.renderFileTree();
                this.dispatchEvent(this.events.structureLoaded, {
                    structure: this.fileStructure,
                    dynamic: false
                });

                console.log('✅ Estrutura carregada de structure.json');
            } else {
                // Se não existir configuração, mostra erro
                this.showError('Arquivo structure.json não encontrado. Por favor, configure a estrutura de arquivos ou use "Selecionar Pasta Local".');
            }

        } catch (error) {
            console.error('Erro ao carregar structure.json:', error);
            this.showError('Erro ao carregar structure.json. Por favor, verifique se o arquivo existe e é válido.');
            throw error;
        }
    }
    
    /**
     * Tenta carregar um arquivo de configuração da estrutura
     */
    async loadConfigFile() {
        try {
            const response = await fetch('./documentos/structure.json');
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            // Arquivo não existe ou não é acessível, não é um erro crítico
            console.log('Arquivo de configuração não encontrado, usando estrutura padrão');
            return null;
        }
    }
    
    /**
     * Configura os listeners de eventos
     */
    setupEventListeners() {
        // Listener para busca de arquivos
        const searchInput = document.getElementById('file-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        // Listener para botão de refresh
        const refreshButton = document.getElementById('refresh-files');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshFileStructure();
            });
        }
    }
    
    /**
     * Lida com a busca de arquivos e conteúdo
     */
    async handleSearch(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase().trim();
        
        if (this.searchTerm === '') {
            this.filteredFiles = { ...this.fileStructure };
            this.contentSearchResults = [];
            this.renderFileTree();
            this.dispatchEvent(this.events.searchUpdated, { searchTerm: this.searchTerm });
            return;
        }

        // Busca por nome de arquivo (busca existente)
        const filenameResults = this.filterFiles(this.fileStructure, this.searchTerm);

        // Busca por conteúdo se disponível
        let contentResults = [];
        if (this.contentSearcher && this.searchTerm.length >= 2) {
            try {
                contentResults = await this.contentSearcher.searchInContent(this.searchTerm);
            } catch (error) {
                console.warn('Erro na busca de conteúdo:', error);
            }
        }

        this.contentSearchResults = contentResults;
        this.filteredFiles = filenameResults;

        // Renderiza resultados combinados
        this.renderSearchResults(filenameResults, contentResults);

        this.dispatchEvent(this.events.searchUpdated, {
            searchTerm: this.searchTerm,
            filenameResults: Object.keys(filenameResults).length,
            contentResults: contentResults.length
        });

        this.dispatchEvent(this.events.contentSearchResults, {
            searchTerm: this.searchTerm,
            results: contentResults
        });
    }

    /**
     * Renderiza resultados de busca combinados
     */
    renderSearchResults(filenameResults, contentResults) {
        const fileTreeContainer = document.getElementById('file-tree');
        if (!fileTreeContainer) return;

        fileTreeContainer.innerHTML = '';

        const totalResults = Object.keys(filenameResults).length + contentResults.length;

        if (totalResults === 0) {
            this.showEmptySearchState(fileTreeContainer);
            return;
        }

        // Cria container para resultados
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';

        // Header com estatísticas
        const statsHeader = document.createElement('div');
        statsHeader.className = 'search-stats';
        statsHeader.innerHTML = `
            <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); background: var(--surface-color);">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="fas fa-search" style="color: var(--primary-color);"></i>
                    <strong>Resultados para "${this.searchTerm}"</strong>
                </div>
                <div style="font-size: 0.875rem; color: var(--text-muted);">
                    ${Object.keys(filenameResults).length} arquivo(s) por nome • ${contentResults.length} resultado(s) de conteúdo
                </div>
            </div>
        `;
        resultsContainer.appendChild(statsHeader);

        // Resultados por nome de arquivo
        if (Object.keys(filenameResults).length > 0) {
            const filenameSection = document.createElement('div');
            filenameSection.className = 'filename-results';

            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'search-section-header';
            sectionHeader.innerHTML = `
                <div style="padding: 0.75rem 1rem; background: var(--hover-color); font-weight: 500; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">
                    <i class="fas fa-chevron-down search-section-toggle"></i>
                    <i class="fas fa-file-alt" style="margin-right: 0.5rem;"></i>
                    Arquivos por Nome (${Object.keys(filenameResults).length})
                </div>
            `;
            filenameSection.appendChild(sectionHeader);

            const filenameContainer = document.createElement('div');
            filenameContainer.className = 'search-section-content';
            this.renderItems(filenameResults, filenameContainer);
            filenameSection.appendChild(filenameContainer);

            // Adiciona evento de clique para expansão/colapso
            sectionHeader.addEventListener('click', () => {
                this.toggleSection(sectionHeader, filenameContainer, 'Arquivos por Nome');
            });

            resultsContainer.appendChild(filenameSection);
        }

        // Resultados por conteúdo
        if (contentResults.length > 0) {
            const contentSection = document.createElement('div');
            contentSection.className = 'content-results';

            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'search-section-header';
            sectionHeader.innerHTML = `
                <div style="padding: 0.75rem 1rem; background: var(--hover-color); font-weight: 500; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">
                    <i class="fas fa-chevron-down search-section-toggle collapsed"></i>
                    <i class="fas fa-search-plus" style="margin-right: 0.5rem;"></i>
                    Resultados de Conteúdo (${contentResults.length})
                </div>
            `;
            contentSection.appendChild(sectionHeader);

            const contentContainer = document.createElement('div');
            contentContainer.className = 'search-section-content collapsed';
            this.renderContentResults(contentResults, contentContainer);
            contentSection.appendChild(contentContainer);

            // Adiciona evento de clique para expansão/colapso
            sectionHeader.addEventListener('click', () => {
                this.toggleSection(sectionHeader, contentContainer, 'Resultados de Conteúdo');
            });

            resultsContainer.appendChild(contentSection);
        }

        fileTreeContainer.appendChild(resultsContainer);
    }

    /**
     * Renderiza resultados de busca de conteúdo
     */
    renderContentResults(contentResults, container) {
        for (const result of contentResults) {
            const resultElement = document.createElement('div');
            resultElement.className = 'content-result-item';
            resultElement.style.cssText = `
                border-bottom: 1px solid var(--border-color);
                padding: 1rem;
                cursor: pointer;
                transition: background-color 0.2s;
            `;

            // Header do arquivo
            const fileHeader = document.createElement('div');
            fileHeader.style.cssText = `
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
                font-weight: 500;
            `;

            // Ícone e badge baseado no tipo de busca
            const isProximitySearch = result.searchType === 'proximity';
            const isExactSearch = result.searchType === 'exact';
            let icon, searchTypeLabel, badge = '';

            if (isExactSearch) {
                icon = 'fas fa-quote-right';
                searchTypeLabel = 'busca exata';
                badge = '<span style="font-size: 0.7rem; background: #9c27b0; color: #fff; padding: 0.2rem 0.4rem; border-radius: 0.8rem; font-weight: 600;">EXATA</span>';
            } else if (isProximitySearch) {
                icon = 'fas fa-link';
                searchTypeLabel = 'termos próximos';
                badge = '<span style="font-size: 0.7rem; background: linear-gradient(45deg, #ffeb3b, #4caf50); color: #000; padding: 0.2rem 0.4rem; border-radius: 0.8rem; font-weight: 600;">PROXIMIDADE</span>';
            } else {
                icon = 'fas fa-file-alt';
                searchTypeLabel = 'ocorrência(s)';
            }

            fileHeader.innerHTML = `
                <i class="${icon}" style="color: var(--primary-color);"></i>
                <span style="color: var(--text-primary);">${result.file.name}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted); background: var(--hover-color); padding: 0.25rem 0.5rem; border-radius: 1rem;">
                    ${result.matchCount} ${searchTypeLabel}
                </span>
                ${badge}
            `;

            resultElement.appendChild(fileHeader);

            // Snippets dos matches
            const snippetsContainer = document.createElement('div');
            snippetsContainer.style.cssText = `
                margin-left: 1.5rem;
                font-size: 0.875rem;
            `;

            // Mostra no máximo 3 snippets por arquivo
            const maxSnippets = Math.min(3, result.matches.length);
            for (let i = 0; i < maxSnippets; i++) {
                const match = result.matches[i];
                const snippet = document.createElement('div');
                snippet.style.cssText = `
                    padding: 0.5rem;
                    margin: 0.25rem 0;
                    background: var(--surface-color);
                    border-radius: var(--border-radius);
                    border-left: 3px solid var(--primary-color);
                    line-height: 1.4;
                `;

                // Cabeçalho do snippet com informações extras para busca por proximidade
                let snippetHeader = `
                    <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.25rem;">
                        Linha ~${match.lineNumber}
                `;

                // Se é busca por proximidade, mostra os termos encontrados
                if (match.proximityGroup && match.termsFound) {
                    const termsText = match.termsFound.map((term, index) =>
                        `<span style="background: ${['#ffeb3b', '#4caf50', '#ff9800'][index % 3]}; color: ${index === 1 ? '#fff' : '#000'}; padding: 0.1rem 0.3rem; border-radius: 0.5rem; font-size: 0.65rem; margin: 0 0.1rem;">${term}</span>`
                    ).join('');
                    snippetHeader += ` • Termos: ${termsText}`;
                }

                snippetHeader += `</div>`;

                snippet.innerHTML = `
                    ${snippetHeader}
                    <div style="color: var(--text-secondary);">
                        ${match.snippet}
                    </div>
                `;

                snippetsContainer.appendChild(snippet);
            }

            // Se há mais matches, mostra indicador
            if (result.matches.length > maxSnippets) {
                const moreIndicator = document.createElement('div');
                moreIndicator.style.cssText = `
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    text-align: center;
                    padding: 0.5rem;
                    font-style: italic;
                `;
                moreIndicator.textContent = `... e mais ${result.matches.length - maxSnippets} ${searchTypeLabel}`;
                snippetsContainer.appendChild(moreIndicator);
            }

            resultElement.appendChild(snippetsContainer);

            // Event listeners
            resultElement.addEventListener('click', () => {
                this.selectFile(result.file);
            });

            resultElement.addEventListener('mouseenter', () => {
                resultElement.style.backgroundColor = 'var(--hover-color)';
            });

            resultElement.addEventListener('mouseleave', () => {
                resultElement.style.backgroundColor = '';
            });

            container.appendChild(resultElement);
        }
    }

    /**
     * Mostra estado vazio para busca sem resultados
     */
    showEmptySearchState(container) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-search-state';
        emptyState.innerHTML = `
            <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p style="margin-bottom: 0.5rem;">Nenhum resultado encontrado para "${this.searchTerm}"</p>
                <small>Tente um termo diferente ou verifique a ortografia</small>
                ${this.contentSearcher ? '' : '<br><small style="color: var(--warning-color);">⚠️ Busca de conteúdo não disponível</small>'}
            </div>
        `;
        container.appendChild(emptyState);
    }
    
    /**
     * Filtra arquivos baseado no termo de busca
     */
    filterFiles(structure, searchTerm) {
        const filtered = {};
        
        for (const [key, item] of Object.entries(structure)) {
            if (item.type === 'file') {
                if (item.name.toLowerCase().includes(searchTerm)) {
                    filtered[key] = item;
                }
            } else if (item.type === 'folder') {
                const filteredChildren = this.filterFiles(item.children, searchTerm);
                const folderMatches = item.name.toLowerCase().includes(searchTerm);
                
                if (Object.keys(filteredChildren).length > 0 || folderMatches) {
                    filtered[key] = {
                        ...item,
                        children: filteredChildren
                    };
                }
            }
        }
        
        return filtered;
    }
    
    /**
     * Renderiza a árvore de arquivos no DOM
     */
    renderFileTree() {
        const fileTreeContainer = document.getElementById('file-tree');
        if (!fileTreeContainer) return;

        // Limpa o container
        fileTreeContainer.innerHTML = '';


        if (Object.keys(this.filteredFiles).length === 0) {
            this.showEmptyState(fileTreeContainer);
            return;
        }

        // Renderiza a estrutura
        this.renderItems(this.filteredFiles, fileTreeContainer);
    }
    
    /**
     * Renderiza itens da estrutura de arquivos
     */
    renderItems(items, container, level = 0) {
        // Ordena os itens: pastas primeiro, depois arquivos, ambos em ordem alfabética
        const sortedEntries = Object.entries(items)
            .sort(([, a], [, b]) => {
                // Pastas antes de arquivos
                if (a.type !== b.type) {
                    return a.type === 'folder' ? -1 : 1;
                }
                // Ordem alfabética
                return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
            });
        for (const [, item] of sortedEntries) {
            const element = this.createItemElement(item, level);
            container.appendChild(element);
            
            if (item.type === 'folder' && item.children) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'folder-children';
                childrenContainer.style.display = 'block'; // Por padrão, mostrar expandido
                
                this.renderItems(item.children, childrenContainer, level + 1);
                container.appendChild(childrenContainer);
            }
        }
    }
    
    /**
     * Cria elemento DOM para um item (arquivo ou pasta)
     */
    createItemElement(item, level) {
        const element = document.createElement('div');
        element.className = item.type === 'file' ? 'file-item' : 'folder-item';
        element.style.paddingLeft = `${1 + (level * 1.5)}rem`;
        element.setAttribute('role', item.type === 'folder' ? 'treeitem' : 'button');
        element.setAttribute('tabindex', '0');
        
        // Ícone
        const icon = document.createElement('i');
        icon.className = item.type === 'file' ? 'fas fa-file-alt' : 'fas fa-folder';
        
        // Nome
        const name = document.createElement('span');
        name.className = item.type === 'file' ? 'file-name' : 'folder-name';
        name.textContent = item.name;
        
        element.appendChild(icon);
        element.appendChild(name);
        
        // Event listeners
        if (item.type === 'file') {
            element.addEventListener('click', () => {
                this.selectFile(item);
            });
            
            element.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectFile(item);
                }
            });
        } else {
            element.addEventListener('click', () => {
                this.toggleFolder(element, icon);
            });
            
            element.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleFolder(element, icon);
                }
            });
        }
        
        return element;
    }
    
    /**
     * Alterna a expansão de uma pasta
     */
    toggleFolder(folderElement, iconElement) {
        const nextSibling = folderElement.nextElementSibling;
        if (nextSibling?.classList.contains('folder-children')) {
            const isHidden = nextSibling.style.display === 'none';
            nextSibling.style.display = isHidden ? 'block' : 'none';
            iconElement.className = isHidden ? 'fas fa-folder-open' : 'fas fa-folder';
        }
    }
    
    /**
     * Seleciona um arquivo
     */
    selectFile(file) {
        // Remove seleção anterior
        const previousSelected = document.querySelector('.file-item.active');
        if (previousSelected) {
            previousSelected.classList.remove('active');
        }
        
        // Adiciona seleção atual
        const fileElements = document.querySelectorAll('.file-item');
        for (const element of fileElements) {
            if (element.querySelector('.file-name').textContent === file.name) {
                element.classList.add('active');
                break;
            }
        }
        
        this.currentPath = file.path;
        this.dispatchEvent(this.events.fileSelected, { file, path: file.path });

        // Rola para o topo do conteúdo quando arquivo é selecionado
        this.scrollToTop();
    }

    /**
     * Rola o conteúdo para o topo suavemente
     */
    scrollToTop() {
        // Tenta múltiplos elementos para garantir que funcione
        const contentArea = document.getElementById('content-display');
        const markdownContent = document.querySelector('#content-display .markdown-content');
        const mainElement = document.querySelector('main');
        const bodyElement = document.body;

        console.log('⬆️ FileManager: Rolando para o topo');

        // Prioriza o scroll no elemento principal de conteúdo
        if (contentArea) {
            contentArea.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

        // Fallback para o body se necessário
        if (bodyElement && bodyElement.scrollTop > 0) {
            bodyElement.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

        // Fallback para window
        if (window.scrollY > 0) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }
    
    /**
     * Mostra estado vazio quando não há arquivos
     */
    showEmptyState(container) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p>Nenhum arquivo encontrado</p>
                <small>Tente um termo de busca diferente</small>
            </div>
        `;
        container.appendChild(emptyState);
    }
    
    /**
     * Mostra erro na interface
     */
    showError(message) {
        const fileTreeContainer = document.getElementById('file-tree');
        if (fileTreeContainer) {
            fileTreeContainer.innerHTML = `
                <div class="error-state" style="padding: 2rem 1rem; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block; color: #ef4444;"></i>
                    <p>${message}</p>
                    <button onclick="fileManager.refreshFileStructure()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Atualiza a estrutura de arquivos
     */
    async refreshFileStructure() {
        const refreshButton = document.getElementById('refresh-files');
        if (refreshButton) {
            const icon = refreshButton.querySelector('i');
            icon.classList.add('fa-spin');
        }
        
        // Limpa o cache
        this.cache.clear();
        
        try {
            // Se estiver usando carregador dinâmico, recarrega da pasta
            if (this.useDynamicLoader && this.dynamicLoader) {
                const structure = await this.dynamicLoader.refresh();
                if (structure) {
                    this.fileStructure = structure;
                    this.filteredFiles = { ...this.fileStructure };
                    this.renderFileTree();
                    this.dispatchEvent(this.events.structureLoaded, { 
                        structure: this.fileStructure,
                        dynamic: true 
                    });
                }
            } else {
                // Senão, recarrega do structure.json
                await this.loadStaticStructure();
            }
        } finally {
            if (refreshButton) {
                const icon = refreshButton.querySelector('i');
                icon.classList.remove('fa-spin');
            }
        }
    }
    
    /**
     * Obtém o caminho de breadcrumb para um arquivo
     */
    getBreadcrumbPath(filePath) {
        if (!filePath) return [];
        
        const parts = filePath.replace('documentos/', '').split('/');
        const breadcrumbs = [];
        let currentPath = 'documentos';
        
        breadcrumbs.push({ name: 'Documentos', path: 'documentos' });
        
        for (let i = 0; i < parts.length - 1; i++) {
            currentPath += '/' + parts[i];
            breadcrumbs.push({
                name: parts[i],
                path: currentPath
            });
        }
        
        return breadcrumbs;
    }
    
    /**
     * Obtém informações de um arquivo
     */
    getFileInfo(filePath) {
        const cached = this.cache.get(filePath);
        if (cached) return cached;
        
        // Simulação de metadados do arquivo
        const info = {
            path: filePath,
            name: filePath.split('/').pop(),
            extension: filePath.split('.').pop(),
            size: Math.floor(Math.random() * 10000) + 1000, // Tamanho simulado
            lastModified: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        };
        
        this.cache.set(filePath, info);
        return info;
    }
    
    /**
     * Dispara evento customizado
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * Obtém a estrutura atual de arquivos
     */
    getFileStructure() {
        return this.fileStructure;
    }
    
    /**
     * Obtém o arquivo atualmente selecionado
     */
    getCurrentFile() {
        return this.currentPath;
    }

    /**
     * Alterna a expansão/colapso de uma seção de busca
     */
    toggleSection(headerElement, contentElement, sectionName) {
        const toggleIcon = headerElement.querySelector('.search-section-toggle');

        if (contentElement.classList.contains('collapsed')) {
            // Expandir seção - calcula altura dinamicamente
            contentElement.style.maxHeight = 'none';
            const fullHeight = contentElement.scrollHeight;
            contentElement.style.maxHeight = '0';

            // Force reflow
            contentElement.offsetHeight;

            contentElement.classList.remove('collapsed');
            toggleIcon.classList.remove('collapsed');
            contentElement.style.maxHeight = fullHeight + 'px';

            // Remove o max-height após a animação para permitir crescimento dinâmico
            setTimeout(() => {
                if (!contentElement.classList.contains('collapsed')) {
                    contentElement.style.maxHeight = 'none';
                }
            }, 300);

            console.log(`📂 ${sectionName}: Seção expandida`);
        } else {
            // Recolher seção
            const currentHeight = contentElement.scrollHeight;
            contentElement.style.maxHeight = currentHeight + 'px';

            // Force reflow
            contentElement.offsetHeight;

            contentElement.classList.add('collapsed');
            toggleIcon.classList.add('collapsed');
            contentElement.style.maxHeight = '0';

            console.log(`📁 ${sectionName}: Seção recolhida`);
        }
    }
}

// Torna a classe disponível globalmente
window.FileManager = FileManager;
