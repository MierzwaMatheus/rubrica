import type { AsaasApi } from "./AsaasApi";
import type {
  Customer,
  CustomerListResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
  Charge,
  ChargeListResponse,
  CreateChargeInput,
  Invoice,
  InvoiceListResponse,
} from "@/types/asaas";

type Action<Args, Result> = (args: Args) => Promise<Result>;

/**
 * Actions do Convex (convex/asaas.ts) já autenticadas, vindas de `useAction`.
 * As do admin exigem papel root/admin: por isso não dá para usar um ConvexHttpClient anônimo.
 */
export interface AsaasActions {
  listCustomers: Action<{ limit?: number; offset?: number }, unknown>;
  createCustomer: Action<
    { name: string; cpfCnpj: string; email?: string; mobilePhone?: string; phone?: string; company?: string },
    unknown
  >;
  deleteCustomer: Action<{ customerId: string }, unknown>;
  listCharges: Action<{ limit?: number; offset?: number }, unknown>;
  getCharge: Action<{ chargeId: string }, unknown>;
  createCharge: Action<
    {
      customer: string;
      billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
      value: number;
      dueDate: string;
      description?: string;
    },
    unknown
  >;
  cancelCharge: Action<{ chargeId: string }, unknown>;
  listInvoices: Action<{ limit?: number; offset?: number }, unknown>;
}

const NOT_SUPPORTED = "Operação não disponível no painel. Use o painel do Asaas.";

export class ConvexAsaasApi implements AsaasApi {
  constructor(private actions: AsaasActions) {}

  async listCustomers(limit: number = 100): Promise<CustomerListResponse> {
    return (await this.actions.listCustomers({ limit })) as CustomerListResponse;
  }

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    return (await this.actions.createCustomer({
      name: input.name,
      cpfCnpj: input.cpfCnpj,
      email: input.email || undefined,
      mobilePhone: input.mobilePhone || undefined,
      phone: input.phone || undefined,
      company: input.company || undefined,
    })) as Customer;
  }

  async getCustomer(_customerId: string): Promise<Customer> {
    throw new Error(NOT_SUPPORTED);
  }

  async updateCustomer(_input: UpdateCustomerInput): Promise<Customer> {
    throw new Error(NOT_SUPPORTED);
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await this.actions.deleteCustomer({ customerId });
  }

  async listCharges(limit: number = 100): Promise<ChargeListResponse> {
    return (await this.actions.listCharges({ limit })) as ChargeListResponse;
  }

  async createCharge(input: CreateChargeInput): Promise<Charge> {
    return (await this.actions.createCharge({
      customer: input.customer,
      billingType: input.billingType,
      value: input.value,
      dueDate: input.dueDate,
      description: input.description || undefined,
    })) as Charge;
  }

  async getCharge(chargeId: string): Promise<Charge> {
    return (await this.actions.getCharge({ chargeId })) as Charge;
  }

  async deleteCharge(chargeId: string): Promise<void> {
    await this.actions.cancelCharge({ chargeId });
  }

  async listInvoices(limit: number = 100): Promise<InvoiceListResponse> {
    return (await this.actions.listInvoices({ limit })) as InvoiceListResponse;
  }

  async getInvoice(_invoiceId: string): Promise<Invoice> {
    throw new Error(NOT_SUPPORTED);
  }
}
