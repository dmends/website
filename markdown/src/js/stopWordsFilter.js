/**
 * Extensão do ContentSearcher para adicionar filtro de stop words
 */

// Adiciona funcionalidade de filtro de stop words ao ContentSearcher existente
if (typeof ContentSearcher !== 'undefined') {
    // Lista de stop words em português
    ContentSearcher.prototype.stopWords = new Set([
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

    /**
     * Remove stop words da lista de termos de busca
     */
    ContentSearcher.prototype.removeStopWords = function(terms) {
        const filteredTerms = terms.filter(term => {
            // Mantém o termo se:
            // 1. Não for uma stop word
            // 2. Tiver mais de 2 caracteres (para manter termos específicos mesmo que sejam stop words)
            return !this.stopWords.has(term.toLowerCase()) || term.length > 2;
        });

        if (filteredTerms.length !== terms.length) {
            console.log(`🚫 Stop words removidas: [${terms.filter(t => !filteredTerms.includes(t)).join(', ')}]`);
            console.log(`✅ Termos mantidos: [${filteredTerms.join(', ')}]`);
        }

        return filteredTerms;
    };

    // Substitui o método performSearch original
    const originalPerformSearch = ContentSearcher.prototype.performSearch;
    ContentSearcher.prototype.performSearch = function(searchTerm) {
        const normalizedTerm = searchTerm.toLowerCase().trim();
        const results = [];

        // Verifica se é uma busca exata (entre aspas)
        const exactSearchMatch = normalizedTerm.match(/^"(.+)"$/);
        if (exactSearchMatch) {
            const exactTerm = exactSearchMatch[1];
            console.log(`🎯 Busca exata para: "${exactTerm}"`);

            // Para busca exata, não aplica filtros de stop words
            for (const [filePath, indexData] of this.searchIndex) {
                const matches = this.findExactMatches(indexData, exactTerm);

                if (matches.length > 0) {
                    results.push({
                        file: indexData.file,
                        matches,
                        matchCount: matches.length,
                        searchType: 'exact'
                    });
                }
            }

            // Ordena por relevância (número de matches)
            results.sort((a, b) => b.matchCount - a.matchCount);
            return results.slice(0, this.config.maxResults);
        }

        // Verifica se é uma busca por múltiplos termos (contém espaço)
        const isMultiTermSearch = normalizedTerm.includes(' ');
        let searchTerms = isMultiTermSearch ? normalizedTerm.split(/\s+/) : [normalizedTerm];

        // Remove stop words dos termos de busca (apenas para busca normal)
        searchTerms = this.removeStopWords(searchTerms);

        // Se não sobrou nenhum termo após filtrar stop words, retorna vazio
        if (searchTerms.length === 0) {
            console.log('🚫 Todos os termos eram stop words, busca cancelada');
            return results;
        }

        console.log(`🔍 Busca após filtrar stop words: [${searchTerms.join(', ')}]`);

        for (const [filePath, indexData] of this.searchIndex) {
            let matches;

            if (searchTerms.length > 1) {
                matches = this.findProximityMatches(indexData, searchTerms);
            } else {
                matches = this.findMatches(indexData, searchTerms[0]);
            }

            if (matches.length > 0) {
                results.push({
                    file: indexData.file,
                    matches,
                    matchCount: matches.length,
                    searchType: searchTerms.length > 1 ? 'proximity' : 'single'
                });
            }
        }

        // Ordena por relevância (número de matches)
        results.sort((a, b) => b.matchCount - a.matchCount);

        return results.slice(0, this.config.maxResults);
    };

    /**
     * Encontra matches exatos para frases entre aspas
     */
    ContentSearcher.prototype.findExactMatches = function(indexData, exactTerm) {
        const { content, originalContent } = indexData;
        const matches = [];
        const regex = new RegExp(this.escapeRegExp(exactTerm), 'gi');

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
                snippet: context.replace(new RegExp(`(${this.escapeRegExp(exactTerm)})`, "gi"), "<mark class=\"search-highlight\">$1</mark>"),
                exactMatch: true
            });
        }

        return matches;
    };

    /**
     * Método auxiliar para escapar caracteres especiais em regex
     */
    ContentSearcher.prototype.escapeRegExp = function(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    /**
     * Método auxiliar para criar snippet destacado
     */
    ContentSearcher.prototype.createHighlightedSnippet = function(context, searchTerm) {
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
        return context.replace(regex, '<mark class="search-highlight">$1</mark>');
    };

    /**
     * Método auxiliar para estimar número da linha
     */
    ContentSearcher.prototype.getLineNumber = function(originalContent, charIndex, normalizedContent) {
        // Aproximação: calcula baseado na proporção de caracteres
        const ratio = charIndex / normalizedContent.length;
        const totalLines = originalContent.split('\n').length;
        return Math.max(1, Math.floor(ratio * totalLines));
    };

    console.log('✅ Filtro de stop words adicionado ao ContentSearcher');
} else {
    console.warn('⚠️ ContentSearcher não encontrado, filtro de stop words não foi adicionado');
}
