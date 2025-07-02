import api from './api';

// Description: Get policy overview
// Endpoint: GET /api/policy/overview
// Request: {}
// Response: { policy: PolicyOverview }
export const getPolicyOverview = async () => {
  try {
    console.log('API: Fetching policy overview');
    const response = await api.get('/api/policy/overview');
    console.log('API: Policy overview response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching policy overview:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get policy violations
// Endpoint: GET /api/policy/violations
// Request: { status?: string, severity?: string }
// Response: { violations: Array<PolicyViolation> }
export const getPolicyViolations = async (filters = {}) => {
  try {
    console.log('API: Fetching policy violations with filters:', filters);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value as string);
    });

    const response = await api.get(`/api/policy/violations?${params.toString()}`);
    console.log('API: Policy violations response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching policy violations:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Submit violation justification
// Endpoint: POST /api/policy/violations/:id/justify
// Request: { id: string, justification: string, documents?: Array<string> }
// Response: { success: boolean, message: string }
export const submitViolationJustification = async (id: string, data: { justification: string; documents?: Array<string> }) => {
  try {
    console.log('API: Submitting violation justification for ID:', id, 'with data:', data);
    const response = await api.post(`/api/policy/violations/${id}/justify`, data);
    console.log('API: Violation justification response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error submitting violation justification:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Upload new policy document
// Endpoint: POST /api/policy/upload
// Request: { file: File, changesSummary?: string }
// Response: { success: boolean, message: string, processingId: string }
export const uploadPolicyDocument = async (file: File, title?: string, description?: string) => {
  console.log('Frontend: uploadPolicyDocument called with file:', file.name);
  console.log('Frontend: File size:', file.size, 'bytes');
  console.log('Frontend: File type:', file.type);
  console.log('Frontend: Title:', title);
  console.log('Frontend: Description:', description);

  try {
    console.log('Frontend: Making API call to upload policy document');
    const formData = new FormData();
    formData.append('document', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    console.log('Frontend: FormData prepared, making POST request to /api/policy/upload');

    const response = await api.post('/api/policy/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    console.log('Frontend: Policy upload API response received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Frontend: Policy upload error:', error);
    console.error('Frontend: Error response:', error?.response?.data);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get policy processing status
// Endpoint: GET /api/policy/processing/:id
// Request: { id: string }
// Response: { status: string, progress: number, currentStep: string, estimatedTimeRemaining: number }
export const getPolicyProcessingStatus = async (id: string) => {
  try {
    console.log('API: Fetching policy processing status for ID:', id);
    const response = await api.get(`/api/policy/processing/${id}`);
    console.log('API: Policy processing status response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching policy processing status:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get all policies
// Endpoint: GET /api/policy
// Request: { status?: string }
// Response: { policies: Array<Policy> }
export const getPolicies = async (filters = {}) => {
  try {
    console.log('API: Fetching policies with filters:', filters);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value as string);
    });

    const response = await api.get(`/api/policy?${params.toString()}`);
    console.log('API: Policies response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching policies:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Create new policy
// Endpoint: POST /api/policy
// Request: { title: string, description: string, effectiveDate: string, document?: File, dailyLimits?: object, restrictedCategories?: Array<string>, approvalRequired?: Array<string> }
// Response: { success: boolean, message: string, policy: Policy }
export const createPolicy = async (data: {
  title: string;
  description: string;
  effectiveDate: string;
  document?: File;
  dailyLimits?: object;
  restrictedCategories?: Array<string>;
  approvalRequired?: Array<string>;
}) => {
  console.log('API createPolicy: Starting policy creation with data:', {
    title: data.title,
    description: data.description,
    effectiveDate: data.effectiveDate,
    hasDocument: !!data.document,
    documentName: data.document?.name,
    documentType: data.document?.type,
    documentSize: data.document?.size
  });

  try {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('effectiveDate', data.effectiveDate);

    if (data.document) {
      console.log('API createPolicy: Appending document to FormData:', data.document.name);
      formData.append('document', data.document);
    }
    if (data.dailyLimits) {
      formData.append('dailyLimits', JSON.stringify(data.dailyLimits));
    }
    if (data.restrictedCategories) {
      formData.append('restrictedCategories', JSON.stringify(data.restrictedCategories));
    }
    if (data.approvalRequired) {
      formData.append('approvalRequired', JSON.stringify(data.approvalRequired));
    }

    console.log('API createPolicy: Making POST request to /api/policy');
    const response = await api.post('/api/policy', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('API createPolicy: Received response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API createPolicy: Error occurred:', error);
    console.error('API createPolicy: Error response:', error?.response?.data);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get single policy
// Endpoint: GET /api/policy/:id
// Request: { id: string }
// Response: { policy: Policy }
export const getPolicyById = async (id: string) => {
  try {
    console.log('API: Fetching policy by ID:', id);
    const response = await api.get(`/api/policy/${id}`);
    console.log('API: Policy by ID response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching policy by ID:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update policy
// Endpoint: PUT /api/policy/:id
// Request: { id: string, ...updateData }
// Response: { success: boolean, message: string, policy: Policy }
export const updatePolicy = async (id: string, data: any) => {
  try {
    console.log('API: Updating policy with ID:', id, 'with data:', data);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'document' && value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      }
    });

    const response = await api.put(`/api/policy/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('API: Policy update response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error updating policy:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Delete policy
// Endpoint: DELETE /api/policy/:id
// Request: { id: string }
// Response: { success: boolean, message: string }
export const deletePolicy = async (id: string) => {
  console.log('API deletePolicy: Starting deletion for policy ID:', id);

  try {
    console.log('API deletePolicy: Making DELETE request to /api/policy/' + id);
    const response = await api.delete(`/api/policy/${id}`);
    console.log('API deletePolicy: Received response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API deletePolicy: Error occurred:', error);
    console.error('API deletePolicy: Error response:', error?.response?.data);
    throw new Error(error?.response?.data?.message || error.message);
  }
};