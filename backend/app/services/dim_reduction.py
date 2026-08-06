import numpy as np
from sklearn.decomposition import PCA


def project_2d(vectors: np.ndarray) -> np.ndarray:
    n = vectors.shape[0]
    if n < 2:
        return np.zeros((n, 2))
    n_components = min(2, n, vectors.shape[1])
    pca = PCA(n_components=n_components, random_state=42)
    projected = pca.fit_transform(vectors)
    if n_components == 1:
        projected = np.hstack([projected, np.zeros((n, 1))])

    max_abs = np.max(np.abs(projected)) or 1.0
    return projected / max_abs


def project_query_2d(existing_vectors: np.ndarray, existing_2d: np.ndarray, query_vector: np.ndarray) -> np.ndarray:
    combined = np.vstack([existing_vectors, query_vector[None, :]])
    n_components = min(2, combined.shape[0], combined.shape[1])
    pca = PCA(n_components=n_components, random_state=42)
    projected = pca.fit_transform(combined)
    if n_components == 1:
        projected = np.hstack([projected, np.zeros((projected.shape[0], 1))])
    max_abs = np.max(np.abs(projected)) or 1.0
    projected = projected / max_abs
    return projected[-1]
