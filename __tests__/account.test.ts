import {ACCOUNTS, processTransactions, summarizeAccounts} from '../src/account';
import {test, expect, afterEach} from 'vitest';

afterEach(() => {
    summarizeAccounts();
    ACCOUNTS.clear();
});

test("test credit for 0 balanace", () => {
    expect(() => {
        processTransactions([
            {action: "Add", card_holder: "peter", amount: "1000", card_number: "12345678912345"},
            {action: "Credit", card_holder: "peter", amount: "200", },
            {action: "Confirm", card_holder: "peter", amount: "0", },
        ]);
    }).throw();
});

test("test tinker", () => {
    expect(() => {
        processTransactions([
            {action: "Add", card_holder: "tinker", amount: "1000", card_number: "12345678912345"},
            {action: "Charge", card_holder: "tinker", amount: "500", },
            {action: "Credit", card_holder: "tinker", amount: "200", },
            {action: "Confirm", card_holder: "tinker", amount: "300", },
        ]);    
    }).not.throw();
});

test("test lily", () => {
    expect(() => {
        processTransactions([
            {action: "Add", card_holder: "tiger", amount: "2000", card_number: "12345678912346"},
            {action: "Charge", card_holder: "tiger", amount: "5", },
            {action: "Credit", card_holder: "tiger", amount: "200", }, 
            {action: "Confirm", card_holder: "tiger", amount: "-195", },
        ]);
    }).not.throw();
});

test("test lily and tinker", () => {
    expect(() => {
        processTransactions([
            {action: "Add", card_holder: "tinker", amount: "1000", card_number: "12345678912345"},
            {action: "Add", card_holder: "lily", amount: "1000", card_number: "12345678912346"},
            {action: "Charge", card_holder: "tinker", amount: "500", },
            {action: "Credit", card_holder: "tinker", amount: "200", },
            {action: "Confirm", card_holder: "tinker", amount: "300", },
            {action: "Charge", card_holder: "lily", amount: "5", },
            {action: "Credit", card_holder: "lily", amount: "200", }, 
            {action: "Confirm", card_holder: "lily", amount: "-195", },
        ]);
    }).not.throw();
});