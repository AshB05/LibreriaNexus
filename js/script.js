/**
 * Librería Nexus - Script principal
 * Maneja carga de libros desde JSON, filtros, búsqueda y modal de detalles
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // ELEMENTOS DEL DOM
    // ============================================

    // Búsqueda en Hero (index.html)
    const heroSearchInput = document.getElementById('heroSearchInput');
    const heroCategorySelect = document.getElementById('heroCategorySelect');
    const heroSearchBtn = document.getElementById('heroSearchBtn');

    // Filtros de catálogo
    const filterTitleInput = document.getElementById('filterTitleInput');
    const filterAuthorInput = document.getElementById('filterAuthorInput');
    const filterCategoryDropdown = document.getElementById('filterCategoryDropdown');
    const sortDropdown = document.getElementById('sortDropdown');
    const toggleAvailableOnly = document.getElementById('toggleAvailableOnly');
    const resultsCounter = document.getElementById('resultsCounter');
    const booksGrid = document.getElementById('booksGrid');
    const noResultsState = document.getElementById('noResultsState');
    const clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
    const resetCategoryFilterBtn = document.getElementById('resetCategoryFilterBtn');

    // Modal Elements
    const modal = document.getElementById('bookDetailModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalIconBtn = document.getElementById('closeModalIconBtn');
    const modalMapAssistBtn = document.getElementById('modalMapAssistBtn');

    const modalTitle = document.getElementById('modalTitle');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalCategory = document.getElementById('modalCategory');
    const modalIsbn = document.getElementById('modalIsbn');
    const modalShelf = document.getElementById('modalShelf');
    const modalSynopsis = document.getElementById('modalSynopsis');
    const modalStockRatio = document.getElementById('modalStockRatio');
    const modalProgressBar = document.getElementById('modalProgressBar');
    const modalStatusDot = document.getElementById('modalStatusDot');
    const modalStatusText = document.getElementById('modalStatusText');
    const modalCover = document.getElementById('modalCover');

    // Nuevos campos del modal
    const modalEditorial = document.getElementById('modalEditorial');
    const modalAnio = document.getElementById('modalAnio');
    const modalIdioma = document.getElementById('modalIdioma');
    const modalPrecio = document.getElementById('modalPrecio');

    // Category cards
    let categoryCards = document.querySelectorAll('.category-card');

    // ============================================
    // ESTADO GLOBAL
    // ============================================
    let allBooks = [];
    let filteredBooks = [];

    // ============================================
    // CARGA DE LIBROS DESDE JSON
    // ============================================

    async function loadBooks() {
        try {
            const response = await fetch('data/libros.json');
            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }
            const data = await response.json();
            allBooks = data.libros || data;
            filteredBooks = [...allBooks];
            
            // Generar tarjetas de categoría dinámicamente
            generateCategoryCards();
            
            renderBooks(allBooks);
            updateCounter(allBooks.length, allBooks.length);
        } catch (error) {
            console.error('Error cargando libros:', error);
            if (booksGrid) {
                booksGrid.innerHTML = '<p class="col-span-full text-center text-on-surface-variant py-8">Error al cargar el catálogo. Por favor, intenta recargar la página.</p>';
            }
        }
    }

    // ============================================
    // GENERAR TARJETAS DE CATEGORÍA DINÁMICAMENTE
    // ============================================

    const categoryIcons = {
        'Literatura': 'menu_book',
        'Ciencia': 'science',
        'Tecnología': 'terminal',
        'Historia': 'account_balance',
        'Filosofía': 'psychology',
        'Psicología': 'psychology',
        'Negocios y Economía': 'trending_up',
        'Arte y Diseño': 'palette'
    };

    function generateCategoryCards() {
        const categoryGrid = document.getElementById('categoryGrid');
        if (!categoryGrid) return;

        // Contar libros por categoría
        const counts = {};
        allBooks.forEach(book => {
            const cat = book.categoria;
            counts[cat] = (counts[cat] || 0) + 1;
        });

        // Obtener categorías únicas ordenadas
        const categories = Object.keys(counts).sort();

        // Generar tarjetas
        categoryGrid.innerHTML = '';
        categories.forEach((category, index) => {
            const count = counts[category];
            const icon = categoryIcons[category] || 'menu_book';
            const number = String(index + 1).padStart(2, '0');

            const card = document.createElement('button');
            card.className = 'category-card group bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all text-left flex flex-col justify-between h-36';
            card.setAttribute('data-category', category);

            card.innerHTML = `
                <div class="flex items-center justify-between w-full">
                    <span class="material-symbols-outlined text-secondary text-[32px] group-hover:scale-110 transition-transform">${icon}</span>
                    <span class="font-label-sm text-label-sm text-outline group-hover:text-secondary">#${number}</span>
                </div>
                <div>
                    <h3 class="font-title-lg text-title-lg text-primary group-hover:text-secondary transition-colors">${category}</h3>
                    <p class="font-body-sm text-body-sm text-on-surface-variant category-count">${count} títulos</p>
                </div>
            `;

            card.addEventListener('click', () => {
                if (filterCategoryDropdown) {
                    filterCategoryDropdown.value = category;
                }
                if (heroCategorySelect) {
                    heroCategorySelect.value = category;
                }

                applyFilters();

                const catalogSection = document.getElementById('catalogo');
                if (catalogSection) {
                    catalogSection.scrollIntoView({ behavior: 'smooth' });
                }
            });

            categoryGrid.appendChild(card);
        });

        // Actualizar referencia a las tarjetas de categoría
        categoryCards = document.querySelectorAll('.category-card');
    }

    // ============================================
    // ACTUALIZAR CANTIDADES DE CATEGORÍAS
    // ============================================

    function updateCategoryCounts() {
        generateCategoryCards();
    }

    // ============================================
    // RENDERIZADO DE TARJETAS DE LIBROS
    // ============================================

    // Mapeo de categorías a nombres de carpeta
    const categoryFolderMap = {
        'Literatura': 'literatura',
        'Ciencia': 'ciencia',
        'Tecnología': 'tecnologia',
        'Historia': 'historia',
        'Filosofía': 'filosofia',
        'Psicología': 'psicologia',
        'Negocios y Economía': 'negocios-economia',
        'Arte y Diseño': 'arte-diseno'
    };

    // Función para generar la ruta de la portada
    function getBookCoverPath(book) {
        const folder = categoryFolderMap[book.categoria] || 'otros';
        return `imagenes/${folder}/${book.id}.jpg`;
    }

    // Función para verificar si una imagen existe
    function checkImageExists(url, callback) {
        const img = new Image();
        img.onload = function() { callback(true); };
        img.onerror = function() { callback(false); };
        img.src = url;
    }

    function getStatusInfo(stock) {
        if (stock === 0) {
            return {
                text: 'Agotado',
                dotClass: 'bg-slate-400',
                textClass: 'text-slate-600',
                barClass: 'bg-slate-400'
            };
        } else if (stock >= 1 && stock <= 3) {
            return {
                text: `Pocas unidades · ${stock} ejemplares`,
                dotClass: 'bg-amber-500',
                textClass: 'text-amber-800',
                barClass: 'bg-amber-500'
            };
        } else {
            return {
                text: `Disponible · ${stock} ejemplares`,
                dotClass: 'bg-emerald-600',
                textClass: 'text-emerald-800',
                barClass: 'bg-emerald-600'
            };
        }
    }

    function createBookCard(book) {
        const status = getStatusInfo(book.stock);
        const card = document.createElement('article');
        card.className = 'book-card bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden';
        card.setAttribute('data-title', book.titulo.toLowerCase());
        card.setAttribute('data-author', book.autor.toLowerCase());
        card.setAttribute('data-category', book.categoria);
        card.setAttribute('data-isbn', book.isbn || '');
        card.setAttribute('data-stock', book.stock);

        const precioate = book.precio ? `$${book.precio.toFixed(2)}` : 'Precio no disponible';
        const coverPath = getBookCoverPath(book);

        card.innerHTML = `
            <div class="relative w-full aspect-[3/4] bg-surface-container-low overflow-hidden">
                <img class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                     alt="${book.titulo}" 
                     src="${coverPath}"
                     onerror="this.src='imagenes/placeholder.jpg'">
                <div class="absolute top-3 left-3">
                    <span class="bg-surface-container-lowest/95 backdrop-blur-sm text-primary font-label-sm text-label-sm px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm font-semibold">
                        ${book.categoria}
                    </span>
                </div>
            </div>
            <div class="p-space-md flex flex-col flex-1 justify-between gap-space-sm">
                <div>
                    <h3 class="font-headline-sm text-headline-sm text-primary line-clamp-1">${book.titulo}</h3>
                    <p class="font-body-sm text-body-sm text-on-surface-variant">${book.autor}</p>
                </div>
                <div class="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
                    <div class="flex justify-between items-center">
                        <span class="font-title-md text-title-md text-primary font-bold">${precioate}</span>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1">
                        <span class="w-2 h-2 rounded-full ${status.dotClass}"></span>
                        <span class="font-label-sm text-label-sm ${status.textClass} font-bold uppercase tracking-wider">${status.text}</span>
                    </div>
                </div>
                <button class="open-modal-btn w-full py-2.5 px-space-sm bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-title-md text-title-md rounded-lg flex items-center justify-center gap-space-xs transition-colors">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                    <span>Ver detalles</span>
                </button>
            </div>
        `;

        // Agregar evento click al botón de detalles
        const detailBtn = card.querySelector('.open-modal-btn');
        detailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openBookModal(book);
        });

        return card;
    }

    function renderBooks(books) {
        if (!booksGrid) return;
        booksGrid.innerHTML = '';
        if (books.length === 0) {
            noResultsState.classList.remove('hidden');
            noResultsState.classList.add('flex');
            return;
        }
        noResultsState.classList.add('hidden');
        noResultsState.classList.remove('flex');

        books.forEach(book => {
            const card = createBookCard(book);
            booksGrid.appendChild(card);
        });
    }

    // ============================================
    // FILTRADO Y BÚSQUEDA
    // ============================================

    function applyFilters() {
        const queryTitle = (filterTitleInput?.value || '').toLowerCase().trim();
        const queryAuthor = (filterAuthorInput?.value || '').toLowerCase().trim();
        const selectedCategory = filterCategoryDropdown?.value || 'all';
        const availableOnly = toggleAvailableOnly?.checked || false;
        const sortMode = sortDropdown?.value || 'default';

        filteredBooks = allBooks.filter(book => {
            // Búsqueda por título, autor, ISBN o categoría
            const searchQuery = queryTitle || queryAuthor;
            const matchesSearch = !searchQuery || 
                book.titulo.toLowerCase().includes(searchQuery) ||
                book.autor.toLowerCase().includes(searchQuery) ||
                (book.isbn && book.isbn.toLowerCase().includes(searchQuery)) ||
                book.categoria.toLowerCase().includes(searchQuery);
            
            const matchesCategory = selectedCategory === 'all' || book.categoria === selectedCategory;
            const matchesAvailability = !availableOnly || book.stock > 0;

            return matchesSearch && matchesCategory && matchesAvailability;
        });

        // Ordenamiento
        switch (sortMode) {
            case 'az':
                filteredBooks.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
                break;
            case 'za':
                filteredBooks.sort((a, b) => b.titulo.localeCompare(a.titulo, 'es'));
                break;
            case 'availability':
                filteredBooks.sort((a, b) => b.stock - a.stock);
                break;
            case 'newest':
                filteredBooks.sort((a, b) => b.id - a.id);
                break;
            case 'price-asc':
                filteredBooks.sort((a, b) => a.precio - b.precio);
                break;
            case 'price-desc':
                filteredBooks.sort((a, b) => b.precio - a.precio);
                break;
            default:
                // "Recomendados Nexus" - ordenar por stock descendente
                filteredBooks.sort((a, b) => b.stock - a.stock);
        }

        renderBooks(filteredBooks);
        updateCounter(filteredBooks.length, allBooks.length);
    }

    function updateCounter(visible, total) {
        if (resultsCounter) {
            resultsCounter.textContent = `Mostrando ${visible} de ${total} títulos seleccionados`;
        }
    }

    // ============================================
    // BÚSQUEDA DESDE HERO
    // ============================================

    function executeHeroSearch() {
        if (!heroSearchInput || !filterTitleInput) return;

        const query = heroSearchInput.value.trim();
        const cat = heroCategorySelect ? heroCategorySelect.value : 'all';

        filterTitleInput.value = query;
        if (filterCategoryDropdown) {
            filterCategoryDropdown.value = cat;
        }

        applyFilters();

        const catalogSection = document.getElementById('catalogo');
        if (catalogSection) {
            catalogSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    if (heroSearchBtn) {
        heroSearchBtn.addEventListener('click', executeHeroSearch);
    }
    if (heroSearchInput) {
        heroSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') executeHeroSearch();
        });
    }

    // ============================================
    // FILTROS - EVENTOS
    // ============================================

    if (filterTitleInput) filterTitleInput.addEventListener('input', applyFilters);
    if (filterAuthorInput) filterAuthorInput.addEventListener('input', applyFilters);
    if (filterCategoryDropdown) filterCategoryDropdown.addEventListener('change', applyFilters);
    if (sortDropdown) sortDropdown.addEventListener('change', applyFilters);
    if (toggleAvailableOnly) toggleAvailableOnly.addEventListener('change', applyFilters);

    // ============================================
    // TARJETAS DE CATEGORÍA
    // ============================================

    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.getAttribute('data-category');
            if (filterCategoryDropdown) {
                filterCategoryDropdown.value = cat;
            }
            if (heroCategorySelect) {
                heroCategorySelect.value = cat;
            }

            applyFilters();

            const catalogSection = document.getElementById('catalogo');
            if (catalogSection) {
                catalogSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ============================================
    // RESET DE FILTROS
    // ============================================

    function resetAllFilters() {
        if (filterTitleInput) filterTitleInput.value = '';
        if (filterAuthorInput) filterAuthorInput.value = '';
        if (filterCategoryDropdown) filterCategoryDropdown.value = 'all';
        if (heroCategorySelect) heroCategorySelect.value = 'all';
        if (heroSearchInput) heroSearchInput.value = '';
        if (toggleAvailableOnly) toggleAvailableOnly.checked = false;
        if (sortDropdown) sortDropdown.value = 'default';
        applyFilters();
    }

    if (clearAllFiltersBtn) clearAllFiltersBtn.addEventListener('click', resetAllFilters);
    if (resetCategoryFilterBtn) resetCategoryFilterBtn.addEventListener('click', resetAllFilters);

    // ============================================
    // MODAL DE DETALLE DE LIBRO
    // ============================================

    function openBookModal(book) {
        const status = getStatusInfo(book.stock);
        const percentage = book.stock > 0 ? Math.min(100, (book.stock / 20) * 100) : 0;

        modalTitle.textContent = book.titulo;
        modalAuthor.textContent = book.autor;
        modalCategory.textContent = book.categoria;
        modalIsbn.textContent = book.isbn || 'No disponible';
        modalSynopsis.textContent = book.descripcion;
        modalStockRatio.textContent = `${book.stock} ejemplares disponibles`;

        // Nuevos campos
        if (modalEditorial) modalEditorial.textContent = book.editorial || 'No disponible';
        if (modalAnio) modalAnio.textContent = book.anio_publicacion || 'No disponible';
        if (modalIdioma) modalIdioma.textContent = book.idioma || 'No disponible';
        if (modalPrecio) modalPrecio.textContent = book.precio ? `$${book.precio.toFixed(2)}` : 'No disponible';

        // Barra de progreso
        modalProgressBar.style.width = `${percentage}%`;
        modalProgressBar.className = `h-full ${status.barClass} rounded-full transition-all duration-500`;

        // Estado visual
        modalStatusDot.className = `w-2.5 h-2.5 rounded-full ${status.dotClass}`;
        modalStatusText.className = `font-label-sm text-label-sm ${status.textClass} font-bold uppercase tracking-wider`;

        if (book.stock === 0) {
            modalStatusText.textContent = 'Agotado temporalmente';
        } else if (book.stock >= 1 && book.stock <= 3) {
            modalStatusText.textContent = `Pocas unidades · ${book.stock} ejemplares`;
        } else {
            modalStatusText.textContent = `Disponible · ${book.stock} ejemplares`;
        }

        // Portada
        const coverPath = getBookCoverPath(book);
        modalCover.src = coverPath;
        modalCover.onerror = () => { modalCover.src = 'imagenes/placeholder.jpg'; };
        modalCover.alt = `Portada de ${book.titulo}`;

        // Mostrar modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (closeModalIconBtn) closeModalIconBtn.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Botón de consulta de ubicación
    if (modalMapAssistBtn) {
        modalMapAssistBtn.addEventListener('click', () => {
            closeModal();
            const contactSection = document.getElementById('contacto');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // ============================================
    // VERIFICAR HASH DE URL (para #categorias)
    // ============================================

    function checkUrlHash() {
        if (window.location.hash === '#categorias') {
            setTimeout(() => {
                const categoriasSection = document.getElementById('categorias');
                if (categoriasSection) {
                    categoriasSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        } else if (window.location.hash === '#catalogo') {
            setTimeout(() => {
                const catalogoSection = document.getElementById('catalogo');
                if (catalogoSection) {
                    catalogoSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        }
    }

    // ============================================
    // LIBROS RECIÉN LLEGADOS (Hero Section)
    // ============================================

    function loadRecentBooks() {
        const container = document.getElementById('recentBooksContainer');
        if (!container) return;

        // Filtrar libros recientes (máximo 4)
        const recentBooks = allBooks.filter(book => book.reciente === true).slice(0, 4);

        if (recentBooks.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center text-on-surface-variant py-4">No hay libros recientes</p>';
            return;
        }

        container.innerHTML = '';

        recentBooks.forEach(book => {
            const coverPath = getBookCoverPath(book);
            const status = getStatusInfo(book.stock);

            const card = document.createElement('div');
            card.className = 'recent-book-card group relative bg-surface-container rounded-lg overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer';
            card.setAttribute('data-book-id', book.id);

            card.innerHTML = `
                <div class="relative w-full aspect-[3/4] bg-surface-container-low overflow-hidden">
                    <img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                         alt="${book.titulo}" 
                         src="${coverPath}"
                         onerror="this.src='imagenes/placeholder.svg'">
                    <!-- Etiqueta NUEVO -->
                    <div class="absolute top-2 left-2">
                        <span class="bg-secondary text-on-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shadow-sm">
                            Nuevo
                        </span>
                    </div>
                </div>
                <div class="p-3">
                    <h4 class="font-title-md text-title-md text-primary line-clamp-1">${book.titulo}</h4>
                    <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">${book.autor}</p>
                    <div class="flex items-center gap-1.5 mt-2">
                        <span class="w-2 h-2 rounded-full ${status.dotClass}"></span>
                        <span class="font-label-sm text-label-sm ${status.textClass} font-bold uppercase tracking-wider">${status.text}</span>
                    </div>
                </div>
            `;

            // Agregar evento click para abrir el modal del libro
            card.addEventListener('click', () => {
                openBookModal(book);
            });

            container.appendChild(card);
        });
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    loadBooks();
    loadRecentBooks();
    checkUrlHash();
});
