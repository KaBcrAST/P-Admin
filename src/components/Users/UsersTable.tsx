import React from 'react';
import { User, SortField, SortOrder } from '../../pages/Users';
import UserActions from './/UserActions';

interface UsersTableProps {
  users: User[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onPromote: (userId: string) => void;
  onDemote: (userId: string) => void;
  actionInProgress: string | null;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  sortField,
  sortOrder,
  onSort,
  onPromote,
  onDemote,
  actionInProgress
}) => {
  // Obtenir une flèche indiquant le sens du tri
  const getSortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  // Formater une date
  const formatDate = (dateString?: Date) => {
    if (!dateString) return "Jamais";
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR");
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <HeaderCell 
              title="Nom" 
              field="name" 
              currentSort={sortField} 
              sortOrder={sortOrder} 
              onSort={onSort} 
            />
            <HeaderCell 
              title="Email" 
              field="email" 
              currentSort={sortField} 
              sortOrder={sortOrder} 
              onSort={onSort} 
            />
            <HeaderCell 
              title="Rôle" 
              field="role" 
              currentSort={sortField} 
              sortOrder={sortOrder} 
              onSort={onSort} 
            />
            <HeaderCell 
              title="Dernière connexion" 
              field="lastLogin" 
              currentSort={sortField} 
              sortOrder={sortOrder} 
              onSort={onSort} 
            />
            <HeaderCell 
              title="Date d'inscription" 
              field="createdAt" 
              currentSort={sortField} 
              sortOrder={sortOrder} 
              onSort={onSort} 
            />
            <th className="py-3 px-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {users.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-3 px-4">{user.name || "Non défini"}</td>
              <td className="py-3 px-4">{user.email}</td>
              <td className="py-3 px-4">
                <RoleBadge role={user.role} />
              </td>
              <td className="py-3 px-4">{formatDate(user.lastLogin)}</td>
              <td className="py-3 px-4">{formatDate(user.createdAt)}</td>
              <td className="py-3 px-4">
                <UserActions 
                  user={user}
                  onPromote={onPromote}
                  onDemote={onDemote}
                  isLoading={actionInProgress === user._id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Aucun utilisateur trouvé.
        </div>
      )}
    </div>
  );
};

// Sous-composant pour l'en-tête de colonne
interface HeaderCellProps {
  title: string;
  field: SortField;
  currentSort: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

const HeaderCell: React.FC<HeaderCellProps> = ({ title, field, currentSort, sortOrder, onSort }) => {
  return (
    <th 
      className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {title}
        <span className="ml-1">
          {currentSort === field ? (
            sortOrder === 'asc' ? '↑' : '↓'
          ) : (
            <span className="text-gray-300 dark:text-gray-600">↕</span>
          )}
        </span>
      </div>
    </th>
  );
};

// Sous-composant pour le badge de rôle
interface RoleBadgeProps {
  role: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${
      role === "admin" 
        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" 
        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }`}>
      {role || "user"}
    </span>
  );
};

export default UsersTable;