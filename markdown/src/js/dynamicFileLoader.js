/**
 * Módulo para carregar arquivos dinamicamente usando File System Access API
 * Permite ao usuário selecionar uma pasta e ler arquivos Markdown sem structure.json
 */

class DynamicFileLoader {
    constructor() {
        this.directoryHandle = null;
        this.fileStructure = {};
        this.supportsFSA = 'showDirectoryPicker' in window;
    }

    /**
     * Verifica se o navegador suporta File System Access API
     */
    isSupported() {
        return this.supportsFSA;
    }

    /**
     * Solicita ao usuário para selecionar uma pasta
     */
    async selectDirectory() {
        if (!this.supportsFSA) {
            throw new Error('File System Access API não é suportada neste navegador. Use Chrome, Edge ou Opera.');
        }

        try {
            this.directoryHandle = await window.showDirectoryPicker({
                mode: 'read',
                startIn: 'documents'
            });

            console.log('✅ Pasta selecionada:', this.directoryHandle.name);
            return this.directoryHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Usuário cancelou a seleção');
                return null;
            }
            throw error;
        }
    }

    /**
     * Lê recursivamente a estrutura de diretórios
     */
    async readDirectoryStructure(directoryHandle = this.directoryHandle, basePath = '') {
        if (!directoryHandle) {
            throw new Error('Nenhuma pasta foi selecionada');
        }

        const structure = {};

        try {
            for await (const entry of directoryHandle.values()) {
                const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;

                if (entry.kind === 'file') {
                    // Verifica se é arquivo Markdown
                    if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
                        structure[entry.name] = {
                            type: 'file',
                            path: currentPath,
                            name: entry.name,
                            handle: entry
                        };
                    }
                } else if (entry.kind === 'directory') {
                    // Lê subdiretório recursivamente
                    const children = await this.readDirectoryStructure(entry, currentPath);
                    
                    // Só adiciona a pasta se tiver arquivos Markdown dentro
                    if (Object.keys(children).length > 0) {
                        structure[entry.name] = {
                            type: 'folder',
                            name: entry.name,
                            path: currentPath,
                            children: children,
                            handle: entry
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao ler estrutura de diretório:', error);
            throw error;
        }

        return structure;
    }

    /**
     * Carrega o conteúdo de um arquivo
     */
    async loadFileContent(fileHandle) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            return content;
        } catch (error) {
            console.error('Erro ao carregar conteúdo do arquivo:', error);
            throw error;
        }
    }

    /**
     * Busca um arquivo por caminho na estrutura
     */
    findFileByPath(path, structure = this.fileStructure) {
        console.log(`🔍 Buscando arquivo: ${path}`);
        console.log('📂 Estrutura disponível:', Object.keys(structure));
        
        // Normaliza o path removendo prefixos comuns
        const normalizedPath = path.replace(/^documentos\//, '').replace(/^\.\//, '');
        console.log(`📝 Path normalizado: ${normalizedPath}`);
        
        // Extrai as partes do path para comparação flexível
        const pathParts = normalizedPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        console.log(`📄 Nome do arquivo procurado: ${fileName}`);
        
        for (const [, item] of Object.entries(structure)) {
            if (item.type === 'file') {
                // Normaliza o path do item também
                const itemPath = item.path.replace(/^documentos\//, '').replace(/^\.\//, '');
                const itemParts = itemPath.split('/');
                
                console.log(`  🔎 Comparando com: ${itemPath} (arquivo: ${item.name})`);
                
                // Match exato
                if (itemPath === normalizedPath || item.path === path) {
                    console.log(`✅ Encontrado (match exato): ${item.name}`);
                    return item;
                }
                
                // Match pelo nome do arquivo - verifica se o nome E a estrutura de pastas coincidem
                if (item.name === fileName) {
                    // Compara as partes do path de trás para frente
                    let matches = true;
                    const minLength = Math.min(pathParts.length, itemParts.length);
                    
                    for (let i = 1; i <= minLength; i++) {
                        const searchPart = pathParts[pathParts.length - i];
                        const itemPart = itemParts[itemParts.length - i];
                        
                        if (searchPart !== itemPart) {
                            matches = false;
                            break;
                        }
                    }
                    
                    if (matches) {
                        console.log(`✅ Encontrado (por estrutura de path): ${item.name}`);
                        console.log(`   Path procurado: ${normalizedPath}`);
                        console.log(`   Path encontrado: ${itemPath}`);
                        return item;
                    }
                }
            }
            
            // Busca em subpastas
            if (item.type === 'folder' && item.children) {
                const found = this.findFileByPath(path, item.children);
                if (found) return found;
            }
        }
        
        console.warn(`❌ Arquivo não encontrado: ${path}`);
        console.log('💡 Dica: Verifique se o arquivo existe na pasta selecionada');
        console.log('💡 Paths disponíveis na estrutura:');
        this._listAllPaths(structure);
        return null;
    }
    
    /**
     * Lista todos os paths disponíveis (para debug)
     */
    _listAllPaths(structure = this.fileStructure, indent = '') {
        for (const [, item] of Object.entries(structure)) {
            if (item.type === 'file') {
                console.log(`   ${indent}📄 ${item.path}`);
            } else if (item.type === 'folder' && item.children) {
                console.log(`   ${indent}📁 ${item.path}/`);
                this._listAllPaths(item.children, indent + '  ');
            }
        }
    }

    /**
     * Inicializa o carregador dinâmico
     */
    async initialize() {
        if (!this.supportsFSA) {
            console.warn('⚠️ File System Access API não suportada. Fallback para structure.json');
            return false;
        }

        const directoryHandle = await this.selectDirectory();
        if (!directoryHandle) {
            return false;
        }

        this.fileStructure = await this.readDirectoryStructure();
        console.log('✅ Estrutura de arquivos carregada dinamicamente:', this.fileStructure);
        
        return true;
    }

    /**
     * Obtém a estrutura de arquivos atual
     */
    getFileStructure() {
        return this.fileStructure;
    }

    /**
     * Reseta o carregador
     */
    reset() {
        this.directoryHandle = null;
        this.fileStructure = {};
    }

    /**
     * Recarrega a estrutura de arquivos
     */
    async refresh() {
        if (this.directoryHandle) {
            this.fileStructure = await this.readDirectoryStructure();
            return this.fileStructure;
        }
        return null;
    }

    /**
     * Obtém metadados de um arquivo
     */
    async getFileMetadata(fileHandle) {
        try {
            const file = await fileHandle.getFile();
            return {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified),
                lastModifiedDate: file.lastModifiedDate
            };
        } catch (error) {
            console.error('Erro ao obter metadados:', error);
            return null;
        }
    }

    /**
     * Lista todos os arquivos Markdown na estrutura
     */
    getAllMarkdownFiles(structure = this.fileStructure) {
        const files = [];
        
        for (const [, item] of Object.entries(structure)) {
            if (item.type === 'file') {
                files.push(item);
            } else if (item.type === 'folder' && item.children) {
                files.push(...this.getAllMarkdownFiles(item.children));
            }
        }
        
        return files;
    }

    /**
     * Busca arquivos por nome ou conteúdo
     */
    searchFiles(searchTerm, structure = this.fileStructure) {
        const results = [];
        const term = searchTerm.toLowerCase();
        
        for (const [, item] of Object.entries(structure)) {
            if (item.type === 'file') {
                if (item.name.toLowerCase().includes(term)) {
                    results.push(item);
                }
            } else if (item.type === 'folder' && item.children) {
                if (item.name.toLowerCase().includes(term)) {
                    results.push(item);
                }
                results.push(...this.searchFiles(searchTerm, item.children));
            }
        }
        
        return results;
    }

    /**
     * Obtém estatísticas da estrutura
     */
    getStatistics() {
        const allFiles = this.getAllMarkdownFiles();
        let folderCount = 0;

        const countFolders = (structure) => {
            for (const item of Object.values(structure)) {
                if (item.type === 'folder') {
                    folderCount++;
                    if (item.children) {
                        countFolders(item.children);
                    }
                }
            }
        };

        countFolders(this.fileStructure);

        return {
            totalFiles: allFiles.length,
            totalFolders: folderCount,
            directoryName: this.directoryHandle?.name || null
        };
    }
}

// Torna a classe disponível globalmente
window.DynamicFileLoader = DynamicFileLoader;
