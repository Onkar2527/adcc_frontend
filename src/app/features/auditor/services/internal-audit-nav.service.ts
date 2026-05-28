import {
    Injectable,
    signal,
} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class InternalAuditNavService {
    assessmentId =
        signal<number | null>(null);

    menus =
        signal<any[]>([]);

    overview =
        signal<any>(null);

    setAssessmentMenus(
        assessmentId: number,
        menus: any[],
        overview?: any,
    ) {
        this.assessmentId.set(
            Number(assessmentId) || null,
        );
        this.menus.set(
            Array.isArray(menus)
                ? menus
                : [],
        );
        this.overview.set(
            overview || null,
        );
    }

    clear() {
        this.assessmentId.set(
            null,
        );
        this.menus.set([]);
        this.overview.set(
            null,
        );
    }
}
