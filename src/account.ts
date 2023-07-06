
export interface AccountID {
  card_holder: string;
}

export interface Account extends AccountID {
  card_number: string;
  limit: number;
  balance: number;
  error?: Error;
};

export interface AccountTransaction extends AccountID  {
  amount: number;
};

export type TransactionAction = 'Add' | 'Charge' | 'Credit' | 'Confirm' | 'Report';

export type Transaction = {
  action: TransactionAction;
  card_holder: string;
  amount?: string;
  card_number?: string;
};

export const ACCOUNTS: Map<string, Account> = new Map<string, Account>();

export class TransactionProcessor { // abstract class
  action: TransactionAction;
  processDetail: (props: Transaction) => void;

  constructor(
    action: TransactionAction, 
    processDetail: (props: Transaction) => void,
  ) {
    this.action = action;
    this.processDetail = processDetail;
  }

  process(test: Transaction): boolean {
    if (this.action !== test.action) {
      return false;
    }
    this.processDetail(test);
    return true;
  };

  static getAccount(card_holder: string): Account {
    const has_account = ACCOUNTS.has(card_holder);
    if (!has_account) {
      throw new Error(`account not exist for ${card_holder}`);
    }

    const account = ACCOUNTS.get(card_holder);
    if (account == null) {
      throw new Error(`account not found for ${card_holder}`);
    }
    return account;
  }
}

export class AddProcessor extends TransactionProcessor {
  constructor() {
    super(
      'Add',
      (props: Transaction): void => {
        const {card_holder, amount = '0', card_number} = props;
        const limit = parseInt(amount, 10);
        if (card_number == null) {
          throw new Error('must have account number');
        }
        const has_account = ACCOUNTS.has(card_holder);
        if (has_account) {
          const _error = new Error(`account duplicated for ${card_holder}`);
          // throw _error;
          return;
        }

        ACCOUNTS.set(card_holder, {card_holder, card_number, limit, balance: 0});
      },
    );
  }
}

export class ChargeProcessor extends TransactionProcessor {
  constructor() {
    super(
      'Charge',
      (props: Transaction): void => {
        const {card_holder, amount: amount_str = '0'} = props;
        const amount = parseInt(amount_str, 10);

        const account = TransactionProcessor.getAccount(card_holder);
        if ((account.balance + amount) > account.limit) {
          const error = new Error('run out of credit limit');
          ACCOUNTS.set(account.card_holder, {...account, error});
          return;
        }
        const balance = account.balance + amount;
        ACCOUNTS.set(account.card_holder, {...account, balance});
      },
    );
  }
}

export class CreditProcessor extends TransactionProcessor {
  constructor() {
    super(
      'Credit',
      (props: Transaction): void => {
        const {card_holder, amount: amount_str = '0'} = props;
        const amount = parseInt(amount_str, 10);

        const account = TransactionProcessor.getAccount(card_holder);
        if (account.balance === 0) {
          const error = new Error('must have a non-zero balance');
          ACCOUNTS.set(account.card_holder, {...account, error});
          return;
        }
        const balance = account.balance - amount;
        ACCOUNTS.set(account.card_holder, {...account, balance});
      }
    );
  }
}

export class ConfirmProcessor extends TransactionProcessor {
  constructor() {
    super(
      'Confirm',
      (props: Transaction): void => {
        const {card_holder, amount: amount_str = '0'} = props;
        const amount = parseInt(amount_str, 10);

        const account = TransactionProcessor.getAccount(card_holder);
        if (account.balance === 0) {
          throw new Error('must have a non-zero balance');
        }
        
        if (account.balance !== amount) {
          throw new Error(`expect ${amount}, but got ${account.balance}`);
        }
      },
    );
  }
}

export class ReportProcessor extends TransactionProcessor {
  constructor() {
    super(
      'Report',
      (props: Transaction): void => {
        const account = TransactionProcessor.getAccount(props.card_holder);
        const {card_holder, balance, error }  = account;
        const message = `${card_holder} ${balance} ${error == null? '' : 'Error'}`;
        console.log(message);
      },
    );
  }
}

export const processTransactions = (
  transactions: Transaction[], 
  givenProcessors?: TransactionProcessor[],
): void => {
  const defaultProcessors: TransactionProcessor[] = [
    new AddProcessor(),
    new ChargeProcessor(),
    new CreditProcessor(),
    new ConfirmProcessor(),
    new ReportProcessor(),
  ];
  const processors: TransactionProcessor[] = givenProcessors ?? defaultProcessors;

  transactions.forEach(test_i => {
    processors.reduce((isProcessed, processor_j) => 
      isProcessed || processor_j.process(test_i), 
      false,
    );
  });  
};

export const summarizeTransactions = () => {
  const reporter = new ReportProcessor();
  [...ACCOUNTS.entries()]
    .sort((a, b) => { 
      const [a_key, _a_account] = a;
      const [b_key, _b_account] = b;
      const a_name = a_key.toLocaleString();
      const b_name = b_key.toLocaleString();
      return a_name.localeCompare(b_name);
    })
    .map<Account>(key_entry => {
      const [key, entry] = key_entry;
      return entry;
    })
    .map<Transaction>(account_i => ({
      action: 'Report',
      card_holder: account_i.card_holder,
    }))
    .forEach((transaction_i) => {
      reporter.process(transaction_i);
    });
};