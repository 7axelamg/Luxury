import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { AuthService } from '../services/auth';
import { RoleService } from '../services/role.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);
  private roleService = inject(RoleService);

  private allowedRoles: string[] = [];
  private isVisible = false;

  @Input() set appHasRole(roles: string | string[]) {
    this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const user = this.authService.getCurrentUser();
    const userRole = this.roleService.normalizeRole(user?.role);
    const hasPermission = this.allowedRoles.some(
      r => this.roleService.normalizeRole(r) === userRole || userRole === 'SUPER_ADMIN'
    );

    if (hasPermission && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasPermission && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}
