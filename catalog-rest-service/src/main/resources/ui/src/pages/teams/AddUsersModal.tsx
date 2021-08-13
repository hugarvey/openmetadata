import { UserTeam } from 'Models';
import React, { useState } from 'react';
import { Button } from '../../components/buttons/Button/Button';
import Searchbar from '../../components/common/searchbar/Searchbar';
import UserCard from './UserCard';
type Props = {
  header: string;
  list: Array<UserTeam>;
  onCancel: () => void;
  onSave: (data: Array<UserTeam>) => void;
};

const AddUsersModal = ({ header, list, onCancel, onSave }: Props) => {
  const [selectedUsers, setSelectedusers] = useState<Array<string>>([]);
  const [searchText, setSearchText] = useState('');

  const selectionHandler = (id: string) => {
    setSelectedusers((prevState) => {
      if (prevState.includes(id)) {
        const userArr = [...prevState];
        const index = userArr.indexOf(id);
        userArr.splice(index, 1);

        return userArr;
      } else {
        return [...prevState, id];
      }
    });
  };
  const getUserCards = () => {
    return list
      .filter((user) => {
        return (
          user.description.includes(searchText) ||
          user.name.includes(searchText)
        );
      })
      .map((user, index) => {
        const User = {
          description: user.description,
          name: user.name,
          id: user.id,
        };

        return (
          <UserCard
            isActionVisible
            isCheckBoxes
            isIconVisible
            item={User}
            key={index}
            onSelect={selectionHandler}
          />
        );
      });
  };

  const handleSave = () => {
    const users = list.filter((user) => {
      return selectedUsers.includes(user.id);
    });
    onSave(users);
  };

  const handleSearchAction = (searchValue: string) => {
    setSearchText(searchValue);
  };

  return (
    <dialog className="tw-modal ">
      <div className="tw-modal-backdrop" />
      <div className="tw-modal-container tw-max-h-90vh tw-max-w-lg">
        <div className="tw-modal-header">
          <p className="tw-modal-title">{header}</p>
        </div>
        <div className="tw-modal-body">
          <Searchbar
            placeholder="Search for user..."
            searchValue={searchText}
            typingInterval={1500}
            onSearch={handleSearchAction}
          />
          <div className="tw-grid tw-grid-cols-2 tw-gap-4">
            {getUserCards()}
          </div>
        </div>
        <div className="tw-modal-footer tw-justify-end">
          <Button
            className="tw-mr-2"
            size="regular"
            theme="primary"
            variant="text"
            onClick={onCancel}>
            Discard
          </Button>
          <Button
            size="regular"
            theme="primary"
            type="submit"
            variant="contained"
            onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </dialog>
  );
};

export default AddUsersModal;
