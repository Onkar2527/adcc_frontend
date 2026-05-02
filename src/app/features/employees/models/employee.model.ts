export interface Employee {
  id: number;
  emp_code: string;
  user_type_id: number;
  name: string;
  email: string;
  mobile: string;
  designation?: string;
  gender: string;
  is_active: number;
  audit_unit_authority?: string;
  created_at?: string;
}

export interface CreateEmployeeDto {
  emp_code: string;
  user_type_id: number;
  name: string;
  email: string;
  mobile: string;
  designation?: string;
  gender: string;
  password?: string;
  is_active?: number;
  audit_unit_authority?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  id?: number;
}
