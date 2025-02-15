let contributions = [];
let savedTransactions = [];
let totalAmountSpent = 0;

// Function to add contributions
function addContribution() {
    let name = document.getElementById("friendName").value.trim();
    let amount = parseFloat(document.getElementById("friendAmount").value);

    if (!isNaN(name) || name === "") {
        alert("Please enter a valid name (letters only)!");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    let contribution = { id: Date.now(), name, amount };
    contributions.push(contribution);
    totalAmountSpent += amount;

    updateContributionsTable();
    updateTotalAmount();

    document.getElementById("friendName").value = "";
    document.getElementById("friendAmount").value = "";
    document.getElementById("friendName").focus();
}

// Function to update contributions table
function updateContributionsTable() {
    let contributionsList = document.getElementById("contributionsList");
    contributionsList.innerHTML = "";

    let fragment = document.createDocumentFragment();
    contributions.forEach((contribution) => {
        let newRow = document.createElement("tr");
        newRow.id = `row-${contribution.id}`;

        newRow.innerHTML = `
            <td>${contribution.name}</td>
            <td>₹${contribution.amount.toFixed(2)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editContribution(${contribution.id})">✏️ Edit</button>
                <button class="action-btn delete-btn" onclick="deleteContribution(${contribution.id})">🗑️ Delete</button>
            </td>
        `;
        fragment.appendChild(newRow);
    });
    contributionsList.appendChild(fragment);
}

// Function to update total amount
function updateTotalAmount() {
    totalAmountSpent = contributions.reduce((sum, c) => sum + c.amount, 0);
    let perPersonAmount = contributions.length > 0 ? (totalAmountSpent / contributions.length).toFixed(2) : "0.00";

    document.getElementById("totalAmount").innerText = `Total Spent: ₹${totalAmountSpent.toFixed(2)}`;
    document.getElementById("perPersonAmount").innerText = `Per Person: ₹${perPersonAmount}`;
}

// Function to edit a contribution
function editContribution(id) {
    let contribution = contributions.find(c => c.id === id);
    if (contribution) {
        let newAmount = parseFloat(prompt(`Edit amount for ${contribution.name}:`, contribution.amount.toFixed(2)));
        if (isNaN(newAmount) || newAmount <= 0) {
            alert("Invalid amount! Please enter a valid number.");
            return;
        }
        totalAmountSpent -= contribution.amount;
        contribution.amount = newAmount;
        totalAmountSpent += newAmount;

        updateContributionsTable();
        updateTotalAmount();
    }
}

// Function to delete a contribution
function deleteContribution(id) {
    contributions = contributions.filter(c => c.id !== id);
    updateContributionsTable();
    updateTotalAmount();
}

// Function to reset all contributions
function resetContributions() {
    contributions = [];
    totalAmountSpent = 0;
    document.getElementById("contributionsList").innerHTML = "";
    document.getElementById("splitResults").innerHTML = "";
    document.getElementById("splitResults").style.display = "none";
    document.getElementById("totalAmount").innerText = "Total Spent: ₹0.00";
    document.getElementById("perPersonAmount").innerText = "Per Person: ₹0.00";
    alert("All contributions have been cleared!");
}

// Function to calculate the split
function calculateSplit() {
    if (contributions.length === 0) {
        alert("No contributions added!");
        return;
    }

    let perPerson = totalAmountSpent / contributions.length;
    let splitResultDiv = document.getElementById("splitResults");
    splitResultDiv.innerHTML = `<h2>💰 Who Pays Whom</h2>`;
    splitResultDiv.style.display = "block";

    if (contributions.length === 1) {
        splitResultDiv.innerHTML += `<div class="split-entry">✅ Only one person has contributed, no split needed!</div>`;
        return;
    }

    let balances = contributions.map(c => ({
        name: c.name,
        balance: c.amount - perPerson
    }));

    let debtors = balances.filter(p => p.balance < 0);
    let creditors = balances.filter(p => p.balance > 0);
    let transactions = [];

    // Settle debts
    while (debtors.length > 0 && creditors.length > 0) {
        let debtor = debtors[0];
        let creditor = creditors[0];

        let amountToPay = Math.min(Math.abs(debtor.balance), creditor.balance);

        transactions.push({
            payer: debtor.name,
            receiver: creditor.name,
            amount: amountToPay.toFixed(2),
        });

        debtor.balance += amountToPay;
        creditor.balance -= amountToPay;

        if (debtor.balance === 0) {
            debtors.shift();
        }
        if (creditor.balance === 0) {
            creditors.shift();
        }
    }

    // Display transactions
    if (transactions.length === 0) {
        splitResultDiv.innerHTML += `<div class="split-entry">✅ Everyone has paid their share!</div>`;
    } else {
        transactions.forEach(transaction => {
            let transactionDiv = document.createElement("div");
            transactionDiv.classList.add("split-entry");
            transactionDiv.innerHTML = `
                <span class="payer">${transaction.payer}</span>
                <span class="arrow">➡</span>
                <span class="receiver">${transaction.receiver}</span>
                <span class="amount">₹${transaction.amount}</span>
            `;
            splitResultDiv.appendChild(transactionDiv);
        });
    }
}

// Function to save the transaction summary
function saveTransactionSummary() {
    if (contributions.length === 0) {
        alert("No contributions to save!");
        return;
    }

    let location = prompt("Enter location:");
    if (!location) {
        alert("Location is required!");
        return;
    }

    let date = new Date().toLocaleString();
    let summary = {
        date,
        location,
        total: totalAmountSpent,
        perPerson: (totalAmountSpent / contributions.length).toFixed(2),
        contributions: contributions // Save contributions as part of the summary
    };

    // Retrieve any existing saved transactions from localStorage
    savedTransactions = JSON.parse(localStorage.getItem("savedTransactions")) || [];

    // Add the new summary to the saved transactions
    savedTransactions.push(summary);

    // Save the updated list of transactions back to localStorage
    localStorage.setItem("savedTransactions", JSON.stringify(savedTransactions));

    alert("Transaction saved successfully!");
}

// Function to view saved transactions
function viewSavedTransactions() {
    let savedTransactionsDiv = document.getElementById("savedSummary");
    savedTransactionsDiv.innerHTML = "<h2>📜 Saved Transactions</h2>";

    savedTransactions = JSON.parse(localStorage.getItem("savedTransactions")) || [];

    if (savedTransactions.length === 0) {
        savedTransactionsDiv.innerHTML += "<p>No saved transactions yet.</p>";
        return;
    }

    savedTransactions.forEach((transaction, index) => {
        let transactionDiv = document.createElement("div");
        transactionDiv.classList.add("transaction-entry");

        let contributionsList = transaction.contributions
            .map(c => `<p>${c.name}: ₹${c.amount.toFixed(2)}</p>`)
            .join("");

        transactionDiv.innerHTML = `
            <h4>📍 ${transaction.location} - ${transaction.date}</h4>
            <p><strong>Total:</strong> ₹${transaction.total.toFixed(2)}</p>
            <p><strong>Per Person:</strong> ₹${transaction.perPerson}</p>
            <div class="details">
                <p><strong>Contributions:</strong></p>
                ${contributionsList}
            </div>
            <button class="delete-btn" onclick="deleteSavedTransaction(${index})">🗑️ Delete</button>
        `;

        savedTransactionsDiv.appendChild(transactionDiv);
    });
}

// Function to delete a saved transaction
function deleteSavedTransaction(index) {
    savedTransactions = JSON.parse(localStorage.getItem("savedTransactions")) || [];

    // Remove the transaction at the specified index
    savedTransactions.splice(index, 1);

    // Save the updated list back to localStorage
    localStorage.setItem("savedTransactions", JSON.stringify(savedTransactions));

    // Reload the saved transactions after deletion
    viewSavedTransactions();
}

// Event Listeners for Enter Key Functionality
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("friendName").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("friendAmount").focus();
        }
    });

    document.getElementById("friendAmount").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addContribution();
        }
    });
});

// Function to handle clicks outside to collapse the details
document.addEventListener("click", function(event) {
    let transactionCards = document.querySelectorAll(".transaction-summary .contributions-list.show");
    transactionCards.forEach(card => {
        if (!card.contains(event.target)) {
            card.classList.remove("show");
        }
    });
});