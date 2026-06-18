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

    updateCategoryProgress(
        assessmentId: number,
        categoryId: number,
        updates: {
            answered_count?: number;
            question_count?: number;
            completed_account_count?: number;
            account_count?: number;
        },
    ) {
        if (
            Number(this.assessmentId()) !== Number(assessmentId)
            || !Array.isArray(this.menus())
        ) {
            return;
        }

        this.menus.update(
            (menus: any[]) =>
                (menus || []).map(
                    (menu: any) => ({
                        ...menu,
                        categories:
                            (menu?.categories || []).map(
                                (category: any) =>
                                    Number(category?.id) === Number(categoryId)
                                        ? {
                                            ...category,
                                            ...updates,
                                        }
                                        : category,
                            ),
                    }),
                ),
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
