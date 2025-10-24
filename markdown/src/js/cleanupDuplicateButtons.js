/**
 * Script para remover botões duplicados da área de breadcrumb
 * Remove os botões change-folder e export-pdf que agora estão no header
 */

document.addEventListener('DOMContentLoaded', function() {
    // Remove os botões duplicados da área de breadcrumb
    removeDuplicateButtons();
});

// Função para remover botões duplicados
function removeDuplicateButtons() {
    const breadcrumbArea = document.querySelector('.breadcrumb');
    if (breadcrumbArea) {
        // Remove o div que contém os botões duplicados
        const buttonContainer = breadcrumbArea.querySelector('div[style*="display: flex"]');
        if (buttonContainer) {
            buttonContainer.remove();
            console.log('✅ Botões duplicados removidos da área de breadcrumb');
        }

        // Remove também qualquer botão individual que possa ter sobrado
        const duplicateChangeFolder = breadcrumbArea.querySelector('#change-folder.action-icon-button');
        const duplicateExportPdf = breadcrumbArea.querySelector('#export-pdf.action-icon-button');

        if (duplicateChangeFolder) {
            duplicateChangeFolder.remove();
            console.log('✅ Botão change-folder duplicado removido');
        }

        if (duplicateExportPdf) {
            duplicateExportPdf.remove();
            console.log('✅ Botão export-pdf duplicado removido');
        }
    }

    // Executa novamente após um pequeno delay para garantir
    setTimeout(removeDuplicateButtons, 100);
}
