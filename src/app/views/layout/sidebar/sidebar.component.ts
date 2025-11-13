import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { UsuariosService } from 'src/app/services/usuarios/usuarios.service';
import { RolesService } from 'src/app/services/roles/roles.service';

import MetisMenu from 'metismenujs';

import { MENU } from './menu';
import { MenuItem } from './menu.model';
import { Router, NavigationEnd } from '@angular/router';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, AfterViewInit {
sidebarMenuClass: string = 'sidebar-nav metismenu mm-collapse-show';

  @ViewChild('sidebarToggler') sidebarToggler: ElementRef;

  menuItems: MenuItem[] = [];
  @ViewChild('sidebarMenu') sidebarMenu: ElementRef;
  private metisMenuInstance: any = null;
  private sidebarClickFixerAttached = false;

  constructor(@Inject(DOCUMENT) private document: Document, private renderer: Renderer2, router: Router, private jwtService: JwtService  ) { 
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {

        /**
         * Activating the current active item dropdown
         */
        this._activateMenuDropdown();

        /**
         * closing the sidebar
         */
        if (window.matchMedia('(max-width: 991px)').matches) {
          this.document.body.classList.remove('sidebar-open');
        }

      }
    });
  }

  nombreUsuarioActual: string = '';

  ngOnInit(): void {
    // Initialize menu from token if available; otherwise fallback to hardcoded MENU.
    this.loadMenuFromTokenOrFallback();


    /**
     * Sidebar-folded on desktop (min-width:992px and max-width: 1199px)
     */
    const desktopMedium = window.matchMedia('(min-width:992px) and (max-width: 1199px)');
    desktopMedium.addEventListener('change', () => {
      this.iconSidebar;
    });
    this.iconSidebar(desktopMedium);

  }

  /**
   * Build menu items from JWT payload (if present). Keep a hardcoded 'Menu' title and 'Inicio' entry.
   */
  private loadMenuFromTokenOrFallback() {
    try {
      this.jwtService.payload$.subscribe(p => {
        if (!p) {
          // no token payload -> fallback to MENU
          this.menuItems = MENU;
        } else {
          const raw = p['menu'];
          let tokenMenu: any[] | null = null;
          try {
            if (!raw) tokenMenu = null;
            else if (typeof raw === 'string') tokenMenu = JSON.parse(raw);
            else if (Array.isArray(raw)) tokenMenu = raw;
          } catch (e) {
            tokenMenu = null;
          }

          if (!tokenMenu || !tokenMenu.length) {
            this.menuItems = MENU;
          } else {
            // Build final menu: Title + Inicio (hardcoded) + token items mapped
            const inicioItem: MenuItem = {
              label: 'Inicio',
              icon: 'icon-bdv-icon-bank-l',
              link: '/inicio'
            };

            const titleItem: MenuItem = { label: 'Menu', isTitle: true };

            // Map token menu recursively
            const mapItem = (it: any): MenuItem => {
              const mapped: MenuItem = {
                label: it.label,
                icon: it.icon || undefined,
                link: it.link || undefined,
                isTitle: !!it.isTitle,
                parentId: it.parentId ? Number(it.parentId) : undefined,
                subItems: (it.subItems && Array.isArray(it.subItems)) ? it.subItems.map((c: any) => mapItem(c)) : []
              } as MenuItem;
              return mapped;
            };

            // Sort top-level by 'order' if present
            tokenMenu.sort((a: any, b: any) => {
              const oa = typeof a.order === 'number' ? a.order : Number(a.order) || 0;
              const ob = typeof b.order === 'number' ? b.order : Number(b.order) || 0;
              return oa - ob;
            });

            const mappedTop = tokenMenu.map(t => mapItem(t));
            this.menuItems = [titleItem, inicioItem, ...mappedTop];
          }
        }

        // Reinitialize MetisMenu after the menu items change so the DOM is wired correctly.
        setTimeout(() => {
          if (this.sidebarMenu) {
            this.recreateMetisMenu();
            this._activateMenuDropdown();
            // Attach a fixer that watches for mm-collapsing left behind and fixes it
            try { this.attachSidebarCollapseFixer(); } catch (e) { /* ignore */ }
          }
        }, 80);
      });
    } catch (e) {
      // safe fallback
      this.menuItems = MENU;
    }
  }

  ngAfterViewInit() {
    // activate menu item
    if (this.sidebarMenu) {
      try {
        this.metisMenuInstance = new MetisMenu(this.sidebarMenu.nativeElement);
      } catch (e) {
        // ignore
        this.metisMenuInstance = null;
      }
      // Espera a que MetisMenu y el DOM estén listos antes de activar el menú
      setTimeout(() => {
        this._activateMenuDropdown();
        // Elimina la clase mm-collapse si está presente tras recarga
        const sidebarMenu = document.getElementById('sidebar-menu');
        if (sidebarMenu && sidebarMenu.classList.contains('mm-collapse')) {
          sidebarMenu.classList.remove('mm-collapse');
        }
        try { this.attachSidebarCollapseFixer(); } catch (e) { }
      }, 200);
    }
  }

  private recreateMetisMenu() {
    try {
      if (this.metisMenuInstance && typeof this.metisMenuInstance.dispose === 'function') {
        try { this.metisMenuInstance.dispose(); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
    try {
      this.metisMenuInstance = new MetisMenu(this.sidebarMenu.nativeElement);
      console.log('[Sidebar] MetisMenu recreated');
    } catch (e) {
      this.metisMenuInstance = null;
    }
  }

  /**
   * Attach a delegated listener to detect submenus that remain in the 'mm-collapsing' state
   * and force them to the final 'mm-collapse mm-show' / collapsed state when necessary.
   */
  private attachSidebarCollapseFixer() {
    if (this.sidebarClickFixerAttached || !this.sidebarMenu || !this.sidebarMenu.nativeElement) return;
    this.sidebarClickFixerAttached = true;
    this.sidebarMenu.nativeElement.addEventListener('click', (ev: MouseEvent) => {
      try {
        const target = ev.target as HTMLElement;
        const anchor = target.closest('a') as HTMLElement | null;
        if (!anchor) return;
        // Only handle parent toggles (anchors that don't navigate)
        const href = (anchor.getAttribute('href') || '').toLowerCase();
        const looksLikeToggle = href.includes('javascript') || href === '#' || !anchor.getAttribute('href') || anchor.classList.contains('side-nav-link-a-ref');
        if (!looksLikeToggle) {
          // let real navigation happen; but still schedule a check to fix stray mm-collapsing elements
          setTimeout(() => this.fixCollapsingElements(), 220);
          return;
        }

        // Prevent default navigation for toggle anchors and perform deterministic toggle
        ev.preventDefault();
        ev.stopPropagation();

        const parentLi = anchor.closest('li');
        let ul: HTMLElement | null = null;
        if (parentLi) {
          // direct child submenu
          ul = parentLi.querySelector(':scope > ul.sub-menu') as HTMLElement | null;
        }

        if (ul) {
          this.toggleSubmenu(ul, anchor, parentLi as HTMLElement);
        }

        // After manual toggle, still ensure any stuck collapsing elements are fixed
        setTimeout(() => this.fixCollapsingElements(), 220);
      } catch (e) { /* ignore */ }
    }, true);
  }

  private toggleSubmenu(ul: HTMLElement, anchor: HTMLElement, parentLi: HTMLElement | null) {
    try {
      const isOpen = ul.classList.contains('mm-show');
      if (isOpen) {
        // collapse
        ul.classList.remove('mm-show');
        ul.classList.add('mm-collapse');
        ul.setAttribute('aria-expanded', 'false');
        if (parentLi) parentLi.classList.remove('mm-active');
        anchor.classList.remove('mm-expanded');
        anchor.classList.add('mm-collapsed');
        try { ul.style.height = '0px'; } catch (e) { }
        // console.log('[Sidebar FIXER] manual collapse applied');
      } else {
        // expand
        ul.classList.add('mm-collapse', 'mm-show');
        ul.setAttribute('aria-expanded', 'true');
        if (parentLi) parentLi.classList.add('mm-active');
        anchor.classList.remove('mm-collapsed');
        anchor.classList.add('mm-expanded');
        try { ul.style.height = 'auto'; } catch (e) { }
        // console.log('[Sidebar FIXER] manual expand applied');
      }
    } catch (e) { console.warn('[Sidebar FIXER] toggleSubmenu error', e); }
  }

  private fixCollapsingElements() {
    try {
      const collapsing = this.sidebarMenu.nativeElement.querySelectorAll('.mm-collapsing');
      if (collapsing && collapsing.length) {
        collapsing.forEach((el: HTMLElement) => {
          try {
            // If element seems collapsed (height 0 or missing), toggle to visible state
            const h = el.style && el.style.height ? el.style.height : '';
            // if it already has mm-show, ensure height auto
            if (el.classList.contains('mm-show')) {
              el.classList.remove('mm-collapsing');
              el.classList.add('mm-collapse');
              try { el.style.height = 'auto'; } catch (e) { }
              el.setAttribute('aria-expanded', 'true');
              const parentLi = el.closest('li');
              if (parentLi) parentLi.classList.add('mm-active');
              console.log('[Sidebar FIXER] Replaced mm-collapsing with mm-collapse mm-show for', el);
            } else if (h === '0px' || !h) {
              // default: make it visible to avoid being stuck
              el.classList.remove('mm-collapsing');
              el.classList.add('mm-collapse', 'mm-show');
              el.setAttribute('aria-expanded', 'true');
              try { el.style.height = 'auto'; } catch (e) { }
              const parentLi = el.closest('li');
              if (parentLi) parentLi.classList.add('mm-active');
              console.log('[Sidebar FIXER] Replaced mm-collapsing with mm-collapse mm-show for', el);
            }
          } catch (e) { /* ignore per-element */ }
        });
      }
    } catch (e) { /* ignore */ }
  }
  /**
   * Toggle sidebar on hamburger button click
   */
  toggleSidebar(e: Event) {
    this.sidebarToggler.nativeElement.classList.toggle('active');
    this.sidebarToggler.nativeElement.classList.toggle('not-active');
    if (window.matchMedia('(min-width: 992px)').matches) {
      e.preventDefault();
      this.document.body.classList.toggle('sidebar-folded');
    } else if (window.matchMedia('(max-width: 991px)').matches) {
      e.preventDefault();
      this.document.body.classList.toggle('sidebar-open');
    }
  }


  /**
   * Toggle settings-sidebar 
   */
  toggleSettingsSidebar(e: Event) {
    e.preventDefault();
    this.document.body.classList.toggle('settings-open');
  }


  /**
   * Open sidebar when hover (in folded folded state)
   */
  operSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')){
      this.document.body.classList.add("open-sidebar-folded");
    }
  }


  /**
   * Fold sidebar after mouse leave (in folded state)
   */
  closeSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')){
      this.document.body.classList.remove("open-sidebar-folded");
    }
  }

  /**
   * Sidebar-folded on desktop (min-width:992px and max-width: 1199px)
   */
  iconSidebar(mq: MediaQueryList) {
    if (mq.matches) {
      this.document.body.classList.add('sidebar-folded');
    } else {
      this.document.body.classList.remove('sidebar-folded');
    }
  }


  /**
   * Switching sidebar light/dark
   */
  onSidebarThemeChange(event: Event) {
    this.document.body.classList.remove('sidebar-light', 'sidebar-dark');
    this.document.body.classList.add((<HTMLInputElement>event.target).value);
    this.document.body.classList.remove('settings-open');
  }


  /**
   * Returns true or false if given menu item has child or not
   * @param item menuItem
   */
  hasItems(item: MenuItem) {
    return item.subItems !== undefined ? item.subItems.length > 0 : false;
  }


  /**
   * Reset the menus then hilight current active menu item
   */
  _activateMenuDropdown() {
    this.resetMenuItems();
    this.activateMenuItems();
  }


  /**
   * Resets the menus
   */
  resetMenuItems() {

    const links = document.getElementsByClassName('nav-link-ref');
    
    for (let i = 0; i < links.length; i++) {
      const menuItemEl = links[i];
      menuItemEl.classList.remove('mm-active');
      const parentEl = menuItemEl.parentElement;

      if (parentEl) {
          parentEl.classList.remove('mm-active');
          const parent2El = parentEl.parentElement;
          
          if (parent2El) {
            parent2El.classList.remove('mm-show');
          }

          const parent3El = parent2El?.parentElement;
          if (parent3El) {
            parent3El.classList.remove('mm-active');

            if (parent3El.classList.contains('side-nav-item')) {
              const firstAnchor = parent3El.querySelector('.side-nav-link-a-ref');

              if (firstAnchor) {
                firstAnchor.classList.remove('mm-active');
              }
            }

            const parent4El = parent3El.parentElement;
            if (parent4El) {
              parent4El.classList.remove('mm-show');

              const parent5El = parent4El.parentElement;
              if (parent5El) {
                parent5El.classList.remove('mm-active');
              }
            }
          }
      }
    }
  };


  /**
   * Toggles the menu items
   */
  activateMenuItems() {
    const links: any = document.getElementsByClassName('nav-link-ref');

    let menuItemEl = null;
    for (let i = 0; i < links.length; i++) {
      if (window.location.pathname === links[i]['pathname']) {
        menuItemEl = links[i];
        break;
      }
    }

    if (menuItemEl) {
      menuItemEl.classList.add('mm-active');
      let parent = menuItemEl.parentElement;
      let level = 0;
      // Sube por los padres y agrega mm-active y mm-show hasta el ul#sidebar-menu
      while (parent && parent.id !== 'sidebar-menu' && level < 10) {
        if (parent.classList.contains('nav-item') || parent.classList.contains('side-nav-item')) {
          parent.classList.add('mm-active');
        }
        if (parent.classList.contains('sub-menu') || parent.classList.contains('sidebar-nav')) {
          parent.classList.add('mm-show');
        }
        parent = parent.parentElement;
        level++;
      }
      // Forzar la clase para evitar colapso del menú
      setTimeout(() => {
        const sidebarMenu = document.getElementById('sidebar-menu');
        if (sidebarMenu) {
          sidebarMenu.classList.add('mm-collapse-show');
          sidebarMenu.classList.remove('mm-collapse');
        }
      }, 100);
    }
  }


}