/**
 * Módulo para destacar termos de busca no conteúdo dos arquivos abertos
 */

class ContentHighlighter {
    constructor() {
        this.currentSearchTerm = '';

        // Lista de stop words em português
        this.stopWords = new Set([
            'a', 'ao', 'aos', 'as', 'até', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos',
            'o', 'os', 'ou', 'para', 'por', 'que', 'se', 'um', 'uma', 'uns', 'umas', 'à', 'às',
            'é', 'são', 'foi', 'ser', 'ter', 'tem', 'seu', 'sua', 'seus', 'suas',
            'me', 'te', 'lhe', 'nos', 'vos', 'lhes', 'meu', 'minha', 'meus', 'minhas',
            'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas',
            'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
            'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo',
            'mas', 'mais', 'muito', 'muita', 'muitos', 'muitas', 'bem', 'só', 'já', 'ainda', 'apenas',
            'quando', 'onde', 'como', 'porque', 'porquê', 'então', 'também', 'nem', 'seja',
            'pelos', 'pelas', 'pela', 'pelo', 'entre', 'sobre', 'sob', 'após', 'antes',
            'durante', 'desde', 'contra', 'sem', 'dentro', 'fora', 'acima', 'abaixo'
        ]);

        this.init();
    }

    /**
     * Remove stop words da lista de termos de busca
     */
    removeStopWords(terms) {
        console.log('🔍 ContentHighlighter: Analisando termos:', terms);
        console.log('🔍 ContentHighlighter: Stop words disponíveis:', Array.from(this.stopWords).slice(0, 10), '...');

        const filteredTerms = terms.filter(term => {
            const isStopWord = this.stopWords.has(term.toLowerCase());
            const shouldKeep = !isStopWord || term.length > 2;
            console.log(`📝 Termo "${term}": stop word = ${isStopWord}, manter = ${shouldKeep}`);
            return shouldKeep;
        });

        if (filteredTerms.length !== terms.length) {
            console.log(`🚫 ContentHighlighter: Stop words removidas: [${terms.filter(t => !filteredTerms.includes(t)).join(', ')}]`);
            console.log(`✅ ContentHighlighter: Termos mantidos para destaque: [${filteredTerms.join(', ')}]`);
        } else {
            console.log(`✅ ContentHighlighter: Nenhuma stop word encontrada, mantendo todos os termos: [${filteredTerms.join(', ')}]`);
        }

        return filteredTerms;
    }

    init() {
        console.log('🎨 ContentHighlighter: Inicializando...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Escuta mudanças na busca
        document.addEventListener('searchUpdated', (event) => {
            console.log('🔍 ContentHighlighter: Termo de busca atualizado:', event.detail.searchTerm);
            this.currentSearchTerm = event.detail.searchTerm || '';
            this.updateContentHighlight();
        });

        // Escuta quando novo conteúdo é carregado
        document.addEventListener('markdownLoaded', (event) => {
            console.log('📄 ContentHighlighter: Novo conteúdo carregado');
            setTimeout(() => {
                this.updateContentHighlight();
                this.scrollToTop(); // Rola para o topo quando novo conteúdo é carregado
            }, 200); // Aumentei o tempo para garantir que o conteúdo seja renderizado
        });

        // Escuta quando arquivo é selecionado
        document.addEventListener('fileSelected', (event) => {
            console.log('📂 ContentHighlighter: Arquivo selecionado');
            setTimeout(() => {
                this.updateContentHighlight();
                this.scrollToTop(); // Rola para o topo quando arquivo é selecionado
            }, 300);
        });
    }

    /**
     * Atualiza o destaque no conteúdo atual
     */
    updateContentHighlight() {
        let contentArea = document.querySelector('#content-display .markdown-content');
        
        // Se não encontrar .markdown-content, usa o próprio #content-display
        if (!contentArea) {
            contentArea = document.querySelector('#content-display');
            console.log('⚠️ ContentHighlighter: .markdown-content não encontrado, usando #content-display');
        }
        console.log('🎯 ContentHighlighter: Atualizando destaque. Área encontrada:', !!contentArea, 'Termo:', this.currentSearchTerm);

        if (!contentArea) return;

        // Remove destaques existentes
        this.removeExistingHighlights(contentArea);

        // Aplica novos destaques se há termo de busca
        if (this.currentSearchTerm && this.currentSearchTerm.length >= 2) {
            console.log('✨ ContentHighlighter: Aplicando destaque para:', this.currentSearchTerm);

            // Verifica se é uma busca exata (entre aspas)
            const exactSearchMatch = this.currentSearchTerm.match(/^"(.+)"$/);
            if (exactSearchMatch) {
                const exactTerm = exactSearchMatch[1];
                console.log('🎯 ContentHighlighter: Aplicando destaque exato para:', exactTerm);
                this.highlightExactTermInContent(contentArea, exactTerm);
                return;
            }

            // Verifica se é busca por múltiplos termos (proximidade)
            const isMultiTermSearch = this.currentSearchTerm.includes(' ');

            if (isMultiTermSearch) {
                let searchTerms = this.currentSearchTerm.split(/\s+/);

                // Remove stop words dos termos de busca
                searchTerms = this.removeStopWords(searchTerms);

                // Se não sobrou nenhum termo após filtrar stop words, não aplica destaque
                if (searchTerms.length === 0) {
                    console.log('🚫 ContentHighlighter: Todos os termos eram stop words, destaque cancelado');
                    return;
                }

                this.highlightProximityTermsInContent(contentArea, searchTerms);
            } else {
                // Para busca de termo único, verifica se é stop word
                const searchTerms = this.removeStopWords([this.currentSearchTerm]);

                if (searchTerms.length === 0) {
                    console.log('🚫 ContentHighlighter: Termo é stop word, destaque cancelado');
                    return;
                }

                this.highlightTermInContent(contentArea, searchTerms[0]);
            }
        }
    }

    /**
     * Destaca termo exato (frase completa) no conteúdo
     */
    highlightExactTermInContent(container, exactTerm) {
        console.log('🎨 Aplicando destaque exato para termo:', exactTerm);

        const allTextNodes = this.getAllTextNodes(container);
        let highlightCount = 0;

        allTextNodes.forEach(textNode => {
            if (this.shouldHighlightNode(textNode, exactTerm)) {
                this.highlightExactTextNode(textNode, exactTerm);
                highlightCount++;
            }
        });

        console.log('✨ Destaques exatos aplicados:', highlightCount);
    }

    /**
     * Destaca um termo no conteúdo
     */
    highlightTermInContent(container, searchTerm) {
        console.log('🎨 Iniciando destaque para termo:', searchTerm);

        // Abordagem mais simples e direta
        const allTextNodes = this.getAllTextNodes(container);
        console.log('📝 Nós de texto encontrados:', allTextNodes.length);

        let highlightCount = 0;

        allTextNodes.forEach(textNode => {
            if (this.shouldHighlightNode(textNode, searchTerm)) {
                this.highlightTextNode(textNode, searchTerm);
                highlightCount++;
            }
        });

        console.log('✨ Destaques aplicados:', highlightCount);
    }

    /**
     * Destaca termo em um nó de texto específico - VERSÃO SEGURA
     */
    highlightTextNode(textNode, searchTerm) {
        // Verificações de segurança
        if (!textNode || !textNode.parentNode || !textNode.textContent) {
            console.warn('⚠️ Nó de texto inválido, pulando destaque');
            return;
        }

        const text = textNode.textContent;
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');

        if (!regex.test(text)) return;

        try {
            // Cria um elemento temporário para processar o HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');

            // Substitui o nó de texto pelos novos elementos
            const parent = textNode.parentNode;

            // Verifica novamente se o parent existe
            if (!parent) {
                console.warn('⚠️ Parent node é null, não é possível aplicar destaque');
                return;
            }

            const fragment = document.createDocumentFragment();

            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            parent.replaceChild(fragment, textNode);
        } catch (error) {
            console.error('❌ Erro ao aplicar destaque:', error, 'Termo:', searchTerm);
        }
    }

    /**
     * Destaca termo em um nó de texto específico com classe CSS customizada - VERSÃO SEGURA
     */
    highlightTextNodeWithClass(textNode, searchTerm, cssClass) {
        // Verificações de segurança
        if (!textNode || !textNode.parentNode || !textNode.textContent) {
            console.warn('⚠️ Nó de texto inválido, pulando destaque com classe');
            return;
        }

        const text = textNode.textContent;
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');

        if (!regex.test(text)) return;

        try {
            // Cria um elemento temporário para processar o HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text.replace(regex, `<mark class="search-highlight ${cssClass}">$1</mark>`);

            // Substitui o nó de texto pelos novos elementos
            const parent = textNode.parentNode;

            // Verifica novamente se o parent existe
            if (!parent) {
                console.warn('⚠️ Parent node é null, não é possível aplicar destaque com classe');
                return;
            }

            const fragment = document.createDocumentFragment();

            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            parent.replaceChild(fragment, textNode);
        } catch (error) {
            console.error('❌ Erro ao aplicar destaque com classe:', error, 'Termo:', searchTerm);
        }
    }

    /**
     * Destaca termo exato em um nó de texto específico - VERSÃO SEGURA
     */
    highlightExactTextNode(textNode, exactTerm) {
        // Verificações de segurança
        if (!textNode || !textNode.parentNode || !textNode.textContent) {
            console.warn('⚠️ Nó de texto inválido, pulando destaque exato');
            return;
        }

        const text = textNode.textContent;
        const regex = new RegExp(`(${this.escapeRegExp(exactTerm)})`, 'gi');

        if (!regex.test(text)) return;

        try {
            // Cria um elemento temporário para processar o HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');

            // Substitui o nó de texto pelos novos elementos
            const parent = textNode.parentNode;

            // Verifica novamente se o parent existe
            if (!parent) {
                console.warn('⚠️ Parent node é null, não é possível aplicar destaque exato');
                return;
            }

            const fragment = document.createDocumentFragment();

            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }

            parent.replaceChild(fragment, textNode);
        } catch (error) {
            console.error('❌ Erro ao aplicar destaque exato:', error, 'Termo:', exactTerm);
        }
    }

    /**
     * Destaca múltiplos termos com cores diferentes para busca por proximidade
     */
    highlightProximityTermsInContent(container, searchTerms) {
        console.log('🎨 Aplicando destaque de proximidade para termos:', searchTerms);
        console.log('🔍 Termos que serão destacados:', searchTerms);

        // Obtém todos os nós de texto ANTES de fazer qualquer modificação
        const allTextNodes = this.getAllTextNodes(container);
        console.log('📝 Nós de texto encontrados:', allTextNodes.length);

        let highlightCount = 0;

        // Processa cada nó de texto uma única vez com todos os termos
        allTextNodes.forEach(textNode => {
            if (!textNode || !textNode.parentNode || !textNode.textContent) {
                return;
            }

            let text = textNode.textContent;
            let hasMatches = false;

            // Verifica se algum termo está presente neste nó
            for (const term of searchTerms) {
                if (text.toLowerCase().includes(term.toLowerCase())) {
                    hasMatches = true;
                    break;
                }
            }

            if (!hasMatches || !this.shouldHighlightNodeForMultipleTerms(textNode, searchTerms)) {
                return;
            }

            try {
                // Aplica destaque para todos os termos de uma vez
                let highlightedText = text;

                searchTerms.forEach((term, index) => {
                    const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
                    const highlightClass = `search-highlight search-highlight-${index % 3}`;
                    highlightedText = highlightedText.replace(regex, `<mark class="${highlightClass}">$1</mark>`);
                });

                // Só aplica se houve mudanças
                if (highlightedText !== text) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = highlightedText;

                    const parent = textNode.parentNode;
                    if (parent) {
                        const fragment = document.createDocumentFragment();
                        while (tempDiv.firstChild) {
                            fragment.appendChild(tempDiv.firstChild);
                        }
                        parent.replaceChild(fragment, textNode);
                        highlightCount++;
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao aplicar destaque de proximidade:', error, 'Termo:', searchTerms);
            }
        });

        console.log('✨ Destaques de proximidade aplicados:', highlightCount);
    }

    /**
     * Verifica se um nó deve receber destaque para múltiplos termos
     */
    shouldHighlightNodeForMultipleTerms(textNode, searchTerms) {
        try {
            // Verifica se contém pelo menos um dos termos
            const text = textNode.textContent.toLowerCase();
            const hasAnyTerm = searchTerms.some(term => text.includes(term.toLowerCase()));

            if (!hasAnyTerm) {
                return false;
            }

            // Verifica se não está dentro de código
            const parent = textNode.parentElement;
            if (parent && (
                parent.tagName === 'CODE' ||
                parent.tagName === 'PRE' ||
                parent.classList.contains('hljs') ||
                parent.closest('pre') ||
                parent.closest('code') ||
                parent.closest('.mermaid') ||
                parent.closest('.swagger-ui')
            )) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Erro ao verificar se deve destacar nó para múltiplos termos:', error);
            return false;
        }
    }

    /**
     * Remove destaques existentes - VERSÃO SEGURA
     */
    removeExistingHighlights(container) {
        try {
            const existingHighlights = container.querySelectorAll('mark.search-highlight');
            existingHighlights.forEach(mark => {
                const parent = mark.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(mark.textContent), mark);
                    parent.normalize();
                }
            });
        } catch (error) {
            console.error('❌ Erro ao remover destaques existentes:', error);
        }
    }

    /**
     * Obtém todos os nós de texto de um container
     */
    getAllTextNodes(container) {
        const textNodes = [];

        try {
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            while (node = walker.nextNode()) {
                // Só adiciona nós que têm parent válido
                if (node.parentNode) {
                    textNodes.push(node);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao obter nós de texto:', error);
        }

        return textNodes;
    }

    /**
     * Verifica se um nó deve receber destaque
     */
    shouldHighlightNode(textNode, searchTerm) {
        try {
            // Verifica se contém o termo
            if (!textNode.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Verifica se não está dentro de código
            const parent = textNode.parentElement;
            if (parent && (
                parent.tagName === 'CODE' ||
                parent.tagName === 'PRE' ||
                parent.classList.contains('hljs') ||
                parent.closest('pre') ||
                parent.closest('code') ||
                parent.closest('.mermaid') ||
                parent.closest('.swagger-ui')
            )) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Erro ao verificar se deve destacar nó:', error);
            return false;
        }
    }

    /**
     * Escapa caracteres especiais para regex
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Remove todos os destaques
     */
    clearAllHighlights() {
        const contentArea = document.getElementById('content-display');
        if (contentArea) {
            this.removeExistingHighlights(contentArea);
        }
    }

    /**
     * Destaca um termo específico (uso manual)
     */
    highlightTerm(term) {
        this.currentSearchTerm = term;
        this.updateContentHighlight();
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

        console.log('⬆️ ContentHighlighter: Rolando para o topo');

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
}

// Inicializa o destacador de conteúdo
document.addEventListener('DOMContentLoaded', () => {
    window.contentHighlighter = new ContentHighlighter();
});

// Torna disponível globalmente
window.ContentHighlighter = ContentHighlighter;
