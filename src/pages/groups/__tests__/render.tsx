/* eslint-disable react-refresh/only-export-components -- test-only helper, never hot reloaded. */
import React from 'react';
import { render, screen, type RenderResult } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { GroupListPage } from '../GroupListPage';
import { GroupDetailsPage } from '../GroupDetailsPage';
import { ProjectGroupCreatePage } from '../ProjectGroupCreatePage';
import { ProjectGroupEditPage } from '../ProjectGroupEditPage';
import { ProjectGroupDetailsPage } from '../ProjectGroupDetailsPage';

function LocationDisplay(): React.JSX.Element {
  const location = useLocation();
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  );
}

/** Render the group routes (as declared in App.tsx) at `path`. */
export function renderGroupRoutes(path: string): RenderResult {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/groups" element={<GroupListPage />} />
        <Route path="/groups/:groupHash" element={<GroupDetailsPage />} />
        <Route
          path="/groups/project-groups/create"
          element={<ProjectGroupCreatePage />}
        />
        <Route
          path="/groups/project-groups/edit/:groupHash"
          element={<ProjectGroupEditPage />}
        />
        <Route
          path="/groups/project-groups/:groupHash"
          element={<ProjectGroupDetailsPage />}
        />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  );
}

export function currentLocation(): string {
  return screen.getByTestId('location').textContent ?? '';
}
