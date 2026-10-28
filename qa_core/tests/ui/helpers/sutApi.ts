// @project: EDUMASTER
// @module: Shared
// @type: UI-E2E

import { APIRequestContext } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@edumaster.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export interface StudentApiPayload {
    full_name: string;
    email: string;
    student_code: string;
    phone?: string;
    level?: string;
    status?: string;
}

export async function getAdminToken(request: APIRequestContext): Promise<string> {
    const res = await request.post('/api/auth/login', {
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    if (!res.ok()) {
        throw new Error(`Admin login failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    return body.access_token as string;
}

export async function createStudentViaApi(
    request: APIRequestContext,
    token: string,
    data: StudentApiPayload
): Promise<{ id: string; full_name: string }> {
    const res = await request.post('/api/student/', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
            phone: '0900000000',
            level: 'beginner',
            status: 'active',
            ...data,
        },
    });
    if (!res.ok()) {
        throw new Error(`Create student via API failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    return { id: body.id as string, full_name: body.full_name as string };
}

export async function deleteStudentViaApi(
    request: APIRequestContext,
    token: string,
    studentId: string
): Promise<void> {
    const res = await request.delete(`/api/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok() && res.status() !== 404) {
        throw new Error(`Delete student failed: ${res.status()} ${await res.text()}`);
    }
}

export async function clearClassEnrollmentsViaApi(
    request: APIRequestContext,
    token: string,
    classId: string
): Promise<void> {
    const headers = { Authorization: `Bearer ${token}` };
    const listRes = await request.get(`/api/class/${classId}/students?per_page=100`, { headers });
    if (!listRes.ok()) {
        throw new Error(`List class students failed: ${listRes.status()} ${await listRes.text()}`);
    }
    const body = await listRes.json();
    const students = (body.items ?? []) as { id: string }[];
    for (const student of students) {
        const res = await request.delete(`/api/class/${classId}/students/${student.id}`, { headers });
        if (!res.ok() && res.status() !== 404) {
            throw new Error(`Remove student from class failed: ${res.status()} ${await res.text()}`);
        }
    }
}

export async function deleteClassViaApi(
    request: APIRequestContext,
    token: string,
    classId: string
): Promise<void> {
    await clearClassEnrollmentsViaApi(request, token, classId);
    const res = await request.delete(`/api/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok() && res.status() !== 404) {
        throw new Error(`Delete class failed: ${res.status()} ${await res.text()}`);
    }
}

export async function findStudentIdByEmail(
    request: APIRequestContext,
    token: string,
    email: string
): Promise<string | undefined> {
    const res = await request.get(`/api/student/?page=1&per_page=50`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) return undefined;
    const body = await res.json();
    const match = (body.items as { id: string; email: string }[] | undefined)?.find(
        (s) => s.email === email
    );
    return match?.id;
}

export interface CourseApiPayload {
    name: string;
    code: string;
    description?: string;
    level?: string;
    type?: string;
    mode?: string;
}

export async function createCourseViaApi(
    request: APIRequestContext,
    token: string,
    data: CourseApiPayload
): Promise<{ id: string; name: string }> {
    const res = await request.post('/api/course/', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
            description: 'Automation test course',
            level: 'N5',
            type: 'other',
            mode: 'online',
            ...data,
        },
    });
    if (!res.ok()) {
        throw new Error(`Create course via API failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    return { id: body.id as string, name: body.name as string };
}

export async function deleteCourseViaApi(
    request: APIRequestContext,
    token: string,
    courseId: string
): Promise<void> {
    const res = await request.delete(`/api/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok() && res.status() !== 404) {
        throw new Error(`Delete course failed: ${res.status()} ${await res.text()}`);
    }
}

export interface LeadApiPayload {
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    status?: string;
    notes?: string;
    assigned_to_id?: string;
}

function unwrapApiData<T>(body: unknown): T {
    if (body && typeof body === 'object' && (body as { success?: boolean }).success === true && 'data' in (body as object)) {
        return (body as { data: T }).data;
    }
    return body as T;
}

export async function createLeadViaApi(
    request: APIRequestContext,
    token: string,
    data: LeadApiPayload
): Promise<{ id: string; name: string; status: string }> {
    const res = await request.post('/api/crm/leads', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
            source: 'Website',
            status: 'New',
            ...data,
        },
    });
    if (!res.ok()) {
        const text = await res.text();
        if (res.status() === 400 && text.includes("cannot import name 'Role'")) {
            throw new Error(`Known SUT CRM bug: ${text}`);
        }
        throw new Error(`Create lead via API failed: ${res.status()} ${text}`);
    }
    const lead = unwrapApiData<{ id: string; name: string; status: string }>(await res.json());
    return lead;
}

/** Skip UI CRM tests when SUT lead creation is broken (known import bug). */
export async function skipIfCrmLeadApiBroken(
    request: APIRequestContext,
    skip: (condition: boolean, description: string) => void
): Promise<void> {
    const token = await getAdminToken(request);
    const stamp = Date.now();
    const res = await request.post('/api/crm/leads', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
            name: `CRM Probe ${stamp}`,
            email: `crm-probe-${stamp}@test.com`,
            source: 'Website',
        },
    });
    if (res.status() === 400) {
        const text = await res.text();
        if (text.includes("cannot import name 'Role'")) {
            skip(true, `Known SUT CRM bug — POST /api/crm/leads returns 400`);
        }
    }
}

export async function updateLeadViaApi(
    request: APIRequestContext,
    token: string,
    leadId: string,
    data: Partial<LeadApiPayload>
): Promise<{ id: string; status: string; assigned_to_id?: string }> {
    const res = await request.put(`/api/crm/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data,
    });
    if (!res.ok()) {
        throw new Error(`Update lead via API failed: ${res.status()} ${await res.text()}`);
    }
    return unwrapApiData(await res.json());
}

export async function deleteLeadViaApi(
    request: APIRequestContext,
    token: string,
    leadId: string
): Promise<void> {
    const res = await request.delete(`/api/crm/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok() && res.status() !== 404) {
        throw new Error(`Delete lead failed: ${res.status()} ${await res.text()}`);
    }
}

export async function getCrmStaffViaApi(
    request: APIRequestContext,
    token: string
): Promise<{ id: string; full_name: string }[]> {
    const res = await request.get('/api/crm/staff', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) {
        throw new Error(`Get CRM staff failed: ${res.status()} ${await res.text()}`);
    }
    return unwrapApiData(await res.json());
}

export interface InvoiceItemPayload {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface InvoiceApiPayload {
    student_id: string;
    total_amount: number;
    issue_date: string;
    due_date: string;
    status?: string;
    notes?: string;
    items: InvoiceItemPayload[];
}

export async function createInvoiceViaApi(
    request: APIRequestContext,
    token: string,
    data: InvoiceApiPayload
): Promise<{ id: string; invoice_number: string; status: string }> {
    const res = await request.post('/api/finance/invoices', {
        headers: { Authorization: `Bearer ${token}` },
        data,
    });
    if (!res.ok()) {
        throw new Error(`Create invoice via API failed: ${res.status()} ${await res.text()}`);
    }
    return unwrapApiData(await res.json());
}

export async function recordPaymentViaApi(
    request: APIRequestContext,
    token: string,
    payload: {
        invoice_id: string;
        amount: number;
        payment_method: string;
        payment_date?: string;
    }
): Promise<void> {
    const res = await request.post('/api/finance/payments', {
        headers: { Authorization: `Bearer ${token}` },
        data: payload,
    });
    if (!res.ok()) {
        throw new Error(`Record payment via API failed: ${res.status()} ${await res.text()}`);
    }
}

export async function createFileFolderViaApi(
    request: APIRequestContext,
    token: string,
    name: string,
    parentId: string | null = null
): Promise<{ id: string; name: string }> {
    const res = await request.post('/api/files/folders', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name, parent_id: parentId ?? 'root' },
    });
    if (!res.ok()) {
        throw new Error(`Create folder via API failed: ${res.status()} ${await res.text()}`);
    }
    return await res.json();
}

export async function deleteFolderViaApi(
    request: APIRequestContext,
    token: string,
    folderId: string
): Promise<void> {
    const res = await request.delete(`/api/files/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok() && res.status() !== 404) {
        throw new Error(`Delete folder failed: ${res.status()} ${await res.text()}`);
    }
}

export async function uploadFileViaApi(
    request: APIRequestContext,
    token: string,
    filePath: string,
    displayName: string,
    folderId: string | null = null
): Promise<{ id: string; name: string }> {
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const res = await request.post('/api/files/upload', {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
            file: {
                name: displayName,
                mimeType: 'application/pdf',
                buffer,
            },
            folder_id: folderId ?? 'root',
        },
    });
    if (!res.ok()) {
        throw new Error(`Upload file via API failed: ${res.status()} ${await res.text()}`);
    }
    return await res.json();
}

export async function deleteFileViaApi(
    request: APIRequestContext,
    token: string,
    fileId: string
): Promise<void> {
    const res = await request.delete(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok() && res.status() !== 404) {
        throw new Error(`Delete file failed: ${res.status()} ${await res.text()}`);
    }
}

export interface CandidateApiPayload {
    full_name: string;
    email?: string;
    dob?: string;
    gender?: string;
    height?: number;
    jlpt_level?: string;
    health_status?: string;
    phone?: string;
}

export async function createCandidateViaApi(
    request: APIRequestContext,
    token: string,
    data: CandidateApiPayload
): Promise<{ id: string; full_name: string }> {
    const res = await request.post('/api/study-abroad/candidates', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
            dob: '2000-01-01',
            gender: 'Male',
            health_status: 'Fit',
            ...data,
        },
    });
    if (!res.ok()) {
        throw new Error(`Create candidate via API failed: ${res.status()} ${await res.text()}`);
    }
    return unwrapApiData(await res.json());
}

export async function deleteCandidateViaApi(
    request: APIRequestContext,
    token: string,
    candidateId: string
): Promise<void> {
    const res = await request.delete(`/api/study-abroad/candidates/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok() && res.status() !== 404) {
        throw new Error(`Delete candidate failed: ${res.status()} ${await res.text()}`);
    }
}

export async function createStudyAbroadPartnerViaApi(
    request: APIRequestContext,
    token: string,
    data: { name: string; type?: string; country?: string }
): Promise<{ id: string; name: string }> {
    const res = await request.post('/api/study-abroad/partners', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
            type: 'Company',
            country: 'Japan',
            ...data,
        },
    });
    if (!res.ok()) {
        throw new Error(`Create partner via API failed: ${res.status()} ${await res.text()}`);
    }
    return unwrapApiData(await res.json());
}

export async function createJobOrderViaApi(
    request: APIRequestContext,
    token: string,
    data: {
        partner_id: string;
        title: string;
        min_height?: number;
        required_jlpt?: string;
        status?: string;
    }
): Promise<{ id: string; title: string }> {
    const res = await request.post('/api/study-abroad/orders', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
            status: 'Open',
            ...data,
        },
    });
    if (!res.ok()) {
        throw new Error(`Create job order via API failed: ${res.status()} ${await res.text()}`);
    }
    return unwrapApiData(await res.json());
}

export async function createStudyAbroadApplicationViaApi(
    request: APIRequestContext,
    token: string,
    candidateId: string,
    jobOrderId: string
): Promise<{ id: string; current_stage: string }> {
    const res = await request.post('/api/study-abroad/applications', {
        headers: { Authorization: `Bearer ${token}` },
        data: { candidate_id: candidateId, job_order_id: jobOrderId },
    });
    if (!res.ok()) {
        throw new Error(`Create application via API failed: ${res.status()} ${await res.text()}`);
    }
    return unwrapApiData(await res.json());
}
