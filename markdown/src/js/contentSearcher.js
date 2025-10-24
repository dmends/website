/**
 * Módulo responsável pela busca de conteúdo dentro dos arquivos Markdown
 */

class ContentSearcher {
    constructor() {
        this.searchIndex = new Map(); // Cache do conteúdo dos arquivos
        this.searchResults = [];
        this.isIndexing = false;
        this.indexedFiles = new Set();

        // Configurações de busca
        this.config = {
            maxResults: 50,
            contextLength: 80, // Reduzido de 150 para 80 caracteres antes e depois do termo encontrado
            minSearchLength: 2, // Mínimo de caracteres para buscar
            debounceTime: 300 // ms para debounce da busca
        };

        this.debounceTimer = null;
        this.init();
    }

    init() {
        console.log('🔍 ContentSearcher: Inicializando...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Escuta quando arquivos são carregados para indexar
        document.addEventListener('markdownLoaded', (event) => {
            const { file, content } = event.detail;
            this.indexFile(file, content);
        });

        // Escuta mudanças na estrutura de arquivos
        document.addEventListener('structureLoaded', () => {
            this.clearIndex();
        });
    }

    /**
     * Indexa o conteúdo de um arquivo para busca
     */
    indexFile(file, content) {
        if (!file || !content) return;

        const normalizedContent = this.normalizeContent(content);
        this.searchIndex.set(file.path, {
            file,
            content: normalizedContent,
            originalContent: content,
            indexed: Date.now()
        });

        this.indexedFiles.add(file.path);
        console.log(`📑 Arquivo indexado: ${file.name}`);
    }

    /**
     * Normaliza o conteúdo para busca (remove markdown, HTML, etc.)
     */
    normalizeContent(content) {
        return content
            // Remove blocos de código
            .replace(/```[\s\S]*?```/g, '')
            // Remove código inline
            .replace(/`[^`]+`/g, '')
            // Remove links markdown
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove imagens markdown
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
            // Remove headers markdown
            .replace(/^#{1,6}\s+/gm, '')
            // Remove HTML tags
            .replace(/<[^>]+>/g, '')
            // Remove caracteres especiais do markdown
            .replace(/[*_~`]/g, '')
            // Normaliza espaços
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Busca por um termo em todos os arquivos indexados
     */
    async searchInContent(searchTerm) {
        if (!searchTerm || searchTerm.length < this.config.minSearchLength) {
            return [];
        }

        // Debounce da busca
        clearTimeout(this.debounceTimer);

        return new Promise((resolve) => {
            this.debounceTimer = setTimeout(() => {
                const results = this.performSearch(searchTerm);
                resolve(results);
            }, this.config.debounceTime);
        });
    }

    /**
     * Executa a busca propriamente dita
     */
    performSearch(searchTerm) {
        const normalizedTerm = searchTerm.toLowerCase().trim();
        const results = [];

        // Verifica se é uma busca por múltiplos termos (contém espaço)
        const isMultiTermSearch = normalizedTerm.includes(' ');
        const searchTerms = isMultiTermSearch ? normalizedTerm.split(/\s+/) : [normalizedTerm];

        for (const [filePath, indexData] of this.searchIndex) {
            let matches;

            if (isMultiTermSearch) {
                matches = this.findProximityMatches(indexData, searchTerms);
            } else {
                matches = this.findMatches(indexData, normalizedTerm);
            }

            if (matches.length > 0) {
                results.push({
                    file: indexData.file,
                    matches,
                    matchCount: matches.length,
                    searchType: isMultiTermSearch ? 'proximity' : 'single'
                });
            }
        }

        // Ordena por relevância (número de matches)
        results.sort((a, b) => b.matchCount - a.matchCount);

        return results.slice(0, this.config.maxResults);
    }

    /**
     * Encontra todas as ocorrências do termo em um arquivo
     */
    findMatches(indexData, searchTerm) {
        const { content, originalContent } = indexData;
        const matches = [];
        const regex = new RegExp(this.escapeRegExp(searchTerm), 'gi');

        let match;
        while ((match = regex.exec(content)) !== null && matches.length < 10) {
            const start = Math.max(0, match.index - this.config.contextLength);
            const end = Math.min(content.length, match.index + match[0].length + this.config.contextLength);

            let context = content.substring(start, end);

            // Adiciona reticências se necessário
            if (start > 0) context = '...' + context;
            if (end < content.length) context = context + '...';

            // Encontra a linha aproximada no conteúdo original
            const lineNumber = this.getLineNumber(originalContent, match.index, content);

            matches.push({
                context,
                matchIndex: match.index,
                matchLength: match[0].length,
                lineNumber,
                snippet: this.createHighlightedSnippet(context, searchTerm)
            });
        }

        return matches;
    }

    /**
     * Encontra matches de proximidade para múltiplos termos
     */
    findProximityMatches(indexData, searchTerms) {
        const { content, originalContent } = indexData;
        const matches = [];
        const proximityDistance = 200; // Distância máxima em caracteres entre termos

        // Encontra todas as posições de cada termo
        const termPositions = {};
        searchTerms.forEach(term => {
            termPositions[term] = [];
            const regex = new RegExp(this.escapeRegExp(term), 'gi');
            let match;
            while ((match = regex.exec(content)) !== null) {
                termPositions[term].push({
                    start: match.index,
                    end: match.index + match[0].length,
                    term: match[0]
                });
            }
        });

        // Verifica se todos os termos foram encontrados
        const foundTerms = Object.keys(termPositions).filter(term => termPositions[term].length > 0);
        if (foundTerms.length < searchTerms.length) {
            return matches; // Retorna vazio se algum termo não foi encontrado
        }

        // Encontra grupos de termos próximos
        const proximityGroups = this.findProximityGroups(termPositions, proximityDistance);

        // Cria matches para cada grupo encontrado
        proximityGroups.forEach((group, index) => {
            if (matches.length >= 10) return; // Limite de matches por arquivo

            const groupStart = Math.min(...group.map(pos => pos.start));
            const groupEnd = Math.max(...group.map(pos => pos.end));

            const contextStart = Math.max(0, groupStart - this.config.contextLength);
            const contextEnd = Math.min(content.length, groupEnd + this.config.contextLength);

            let context = content.substring(contextStart, contextEnd);

            // Adiciona reticências se necessário
            if (contextStart > 0) context = '...' + context;
            if (contextEnd < content.length) context = context + '...';

            // Encontra a linha aproximada no conteúdo original
            const lineNumber = this.getLineNumber(originalContent, groupStart, content);

            matches.push({
                context,
                matchIndex: groupStart,
                matchLength: groupEnd - groupStart,
                lineNumber,
                snippet: this.createProximityHighlightedSnippet(context, searchTerms),
                termsFound: group.map(pos => pos.term),
                proximityGroup: true
            });
        });

        return matches;
    }

    /**
     * Encontra grupos de termos que estão próximos uns dos outros
     */
    findProximityGroups(termPositions, maxDistance) {
        const allPositions = [];

        // Coleta todas as posições com informação do termo
        Object.keys(termPositions).forEach(term => {
            termPositions[term].forEach(pos => {
                allPositions.push({
                    ...pos,
                    termKey: term
                });
            });
        });

        // Ordena por posição
        allPositions.sort((a, b) => a.start - b.start);

        const groups = [];
        const usedPositions = new Set();

        // Para cada posição, tenta formar um grupo
        allPositions.forEach(pos => {
            if (usedPositions.has(pos.start)) return;

            const group = [pos];
            const termsInGroup = new Set([pos.termKey]);
            usedPositions.add(pos.start);

            // Procura outros termos próximos
            allPositions.forEach(otherPos => {
                if (usedPositions.has(otherPos.start)) return;
                if (otherPos.termKey === pos.termKey) return; // Mesmo termo

                const distance = Math.abs(otherPos.start - pos.start);
                if (distance <= maxDistance && !termsInGroup.has(otherPos.termKey)) {
                    group.push(otherPos);
                    termsInGroup.add(otherPos.termKey);
                    usedPositions.add(otherPos.start);
                }
            });

            // Só adiciona o grupo se contém pelo menos 2 termos diferentes
            if (termsInGroup.size >= 2) {
                groups.push(group);
            }
        });

        return groups;
    }

    /**
     * Cria um snippet com o termo destacado
     */
    createHighlightedSnippet(context, searchTerm) {
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
        return context.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    /**
     * Cria um snippet com destaque para busca de proximidade
     */
    createProximityHighlightedSnippet(context, searchTerms) {
        let highlighted = context;

        // Destaca cada termo com uma cor ligeiramente diferente
        searchTerms.forEach((term, index) => {
            const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
            const highlightClass = `search-highlight search-highlight-${index % 3}`;
            highlighted = highlighted.replace(regex, `<mark class="${highlightClass}">$1</mark>`);
        });

        return highlighted;
    }

    /**
     * Estima o número da linha baseado na posição no texto
     */
    getLineNumber(originalContent, charIndex, normalizedContent) {
        // Aproximação: calcula baseado na proporção de caracteres
        const ratio = charIndex / normalizedContent.length;
        const totalLines = originalContent.split('\n').length;
        return Math.max(1, Math.floor(ratio * totalLines));
    }

    /**
     * Escapa caracteres especiais para regex
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Indexa múltiplos arquivos de uma vez
     */
    async indexMultipleFiles(files) {
        this.isIndexing = true;
        console.log(`🔄 Indexando ${files.length} arquivos...`);

        try {
            for (const file of files) {
                if (!this.indexedFiles.has(file.path)) {
                    try {
                        const content = await this.loadFileForIndexing(file);
                        this.indexFile(file, content);
                    } catch (error) {
                        console.warn(`⚠️ Erro ao indexar ${file.path}:`, error);
                    }
                }
            }
        } finally {
            this.isIndexing = false;
        }

        console.log(`✅ Indexação concluída. ${this.indexedFiles.size} arquivos indexados.`);
    }

    /**
     * Carrega conteúdo de arquivo para indexação
     */
    async loadFileForIndexing(file) {
        const markdownProcessor = window.markdownProcessor;
        if (markdownProcessor) {
            return await markdownProcessor.loadFileContent(file.path);
        }

        // Fallback direto
        const response = await fetch(file.path);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.text();
    }

    /**
     * Obtém todos os arquivos markdown da estrutura
     */
    getAllMarkdownFiles(structure = {}) {
        const files = [];

        for (const item of Object.values(structure)) {
            if (item.type === 'file' && item.name.endsWith('.md')) {
                files.push(item);
            } else if (item.type === 'folder' && item.children) {
                files.push(...this.getAllMarkdownFiles(item.children));
            }
        }

        return files;
    }

    /**
     * Indexa todos os arquivos markdown da estrutura
     */
    async indexAllFiles() {
        const fileManager = window.fileManager;
        if (!fileManager) return;

        const structure = fileManager.getFileStructure();
        const markdownFiles = this.getAllMarkdownFiles(structure);

        await this.indexMultipleFiles(markdownFiles);
    }

    /**
     * Limpa o índice de busca
     */
    clearIndex() {
        this.searchIndex.clear();
        this.indexedFiles.clear();
        this.searchResults = [];
        console.log('🗑️ Índice de busca limpo');
    }

    /**
     * Obtém estatísticas do índice
     */
    getIndexStats() {
        return {
            indexedFiles: this.indexedFiles.size,
            totalSize: Array.from(this.searchIndex.values())
                .reduce((sum, item) => sum + item.content.length, 0),
            isIndexing: this.isIndexing,
            lastUpdate: Math.max(...Array.from(this.searchIndex.values())
                .map(item => item.indexed))
        };
    }

    /**
     * Remove arquivo do índice
     */
    removeFromIndex(filePath) {
        this.searchIndex.delete(filePath);
        this.indexedFiles.delete(filePath);
    }
}

// Torna disponível globalmente
window.ContentSearcher = ContentSearcher;
