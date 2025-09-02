// Este arquivo é responsável apenas pela lógica dos filtros de data.

/**
 * Retorna os timestamps de início e fim para um filtro de data.
 * @param {string} filter O tipo de filtro ('today', 'week', 'month', 'all').
 * @returns {{start: number, end: number}} Objeto com os timestamps de início e fim.
 */
function getDates(filter) {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    switch (filter) {
        case 'week':
            const dayOfWeek = start.getDay();
            const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            start.setDate(diff);
            break;
        case 'month':
            start.setDate(1);
            break;
        case 'all':
            return { start: 0, end: Date.now() };
        default: // 'today'
            break;
    }
    return { start: start.getTime(), end: end.getTime() };
}

/**
 * Configura os event listeners para os botões de filtro de data.
 * @param {function(number, number): void} callback A função a ser chamada com os timestamps de início e fim.
 */
export function setupDateFilters(callback) {
    document.getElementById('filter-today').addEventListener('click', () => {
        const { start, end } = getDates('today');
        callback(start, end);
    });

    document.getElementById('filter-week').addEventListener('click', () => {
        const { start, end } = getDates('week');
        callback(start, end);
    });

    document.getElementById('filter-month').addEventListener('click', () => {
        const { start, end } = getDates('month');
        callback(start, end);
    });

    document.getElementById('filter-all').addEventListener('click', () => {
        const { start, end } = getDates('all');
        callback(start, end);
    });

    document.getElementById('filter-custom').addEventListener('click', () => {
        const startDateInput = document.getElementById('start-date').value;
        const endDateInput = document.getElementById('end-date').value;

        if (startDateInput && endDateInput) {
            const startDate = new Date(startDateInput);
            const endDate = new Date(endDateInput);
            endDate.setHours(23, 59, 59, 999); 
            callback(startDate.getTime(), endDate.getTime());
        } else {
            alert("Por favor, selecione uma data de início e fim válidas.");
        }
    });
}